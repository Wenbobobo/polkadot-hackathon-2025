import http, { type IncomingMessage, type ServerResponse } from 'http'
import { URL } from 'url'

import { loadConfig } from './config'
import type {
  AssistantConfig,
  AssistantMode,
  HintRequestBody,
  HintResponse,
  ResponsePathSegment,
} from './types'

type FetchImpl = typeof fetch

interface AssistantDependencies {
  fetchImpl?: FetchImpl
}

const defaultFetchImpl: FetchImpl = (...args) => fetch(...args)

const jsonResponse = (
  res: ServerResponse,
  status: number,
  body: Record<string, unknown>,
  corsOrigin?: string | string[],
  corsHeaders?: string[],
  corsMethods?: string[]
) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  if (corsOrigin) {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin)
  }
  if (corsHeaders) {
    res.setHeader('Access-Control-Allow-Headers', corsHeaders.join(', '))
  }
  if (corsMethods) {
    res.setHeader('Access-Control-Allow-Methods', corsMethods.join(', '))
  }
  res.end(JSON.stringify(body))
}

const readRequestBody = async (req: IncomingMessage) => {
  const chunks: Buffer[] = []

  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk))
  }

  if (chunks.length === 0) return undefined
  const jsonString = Buffer.concat(chunks).toString('utf-8')
  return jsonString
}

const replaceTokens = (value: unknown, context: Record<string, string>) => {
  if (typeof value === 'string') {
    return value.replace(/{{(.*?)}}/g, (_, key) => {
      const trimmed = String(key).trim()
      return context[trimmed] ?? ''
    })
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceTokens(item, context))
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<
      Record<string, unknown>
    >((acc, [key, val]) => {
      acc[key] = replaceTokens(val, context)
      return acc
    }, {})
  }

  return value
}

const pickByPath = (
  payload: unknown,
  path: ResponsePathSegment[] | undefined
): unknown => {
  if (!path || path.length === 0) {
    return payload
  }

  return path.reduce<unknown>((acc, segment) => {
    if (acc === undefined || acc === null) {
      return undefined
    }

    if (typeof segment === 'number') {
      if (Array.isArray(acc)) {
        return acc[segment]
      }
      return undefined
    }

    if (typeof acc === 'object' && segment in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[segment]
    }

    return undefined
  }, payload)
}

const selectMessage = (
  upstreamPayload: unknown,
  path?: ResponsePathSegment[]
) => {
  const candidate = pickByPath(upstreamPayload, path)
  if (typeof candidate === 'string') {
    return candidate.trim()
  }

  if (typeof candidate === 'number') {
    return String(candidate)
  }

  return undefined
}

const chooseStaticMessage = (
  config: AssistantConfig,
  context: Record<string, string>
) => {
  const { staticMessages } = config.assistant
  if (!staticMessages || staticMessages.length === 0) {
    return 'Poke the dots – Worboo is still training!'
  }
  const index = Math.floor(Math.random() * staticMessages.length)
  const message = staticMessages[index]
  const rendered = replaceTokens(message, context)
  return typeof rendered === 'string' ? rendered : String(message)
}

const handleProxy = async (
  config: AssistantConfig,
  body: HintRequestBody,
  fetchImpl: FetchImpl,
  context: Record<string, string>
) => {
  const proxyConfig = config.assistant.proxy
  if (!proxyConfig) {
    throw new Error('Proxy configuration missing')
  }

  const method = proxyConfig.method ?? 'POST'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(proxyConfig.headers ?? {}),
  }

  const payload =
    proxyConfig.bodyTemplate ?? ({
      model: body.model,
      prompt: body.prompt,
      systemPrompt: config.assistant.systemPrompt ?? '',
    } as Record<string, unknown>)

  const hydratedPayload = replaceTokens(payload, context)

  const controller = new AbortController()
  const timeout =
    typeof proxyConfig.timeoutMs === 'number'
      ? setTimeout(() => controller.abort(), proxyConfig.timeoutMs)
      : undefined

  try {
    const response = await fetchImpl(proxyConfig.url, {
      method,
      headers,
      body: method.toUpperCase() === 'GET' ? undefined : JSON.stringify(hydratedPayload),
      signal: controller.signal,
    })

    const upstreamJson = await response.json().catch(() => undefined)
    const message = selectMessage(upstreamJson, proxyConfig.responsePath)
    return {
      message,
      upstreamStatus: response.status,
    }
  } finally {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}

const hintResponse = async (
  config: AssistantConfig,
  body: HintRequestBody | undefined,
  fetchImpl: FetchImpl
): Promise<HintResponse> => {
  if (!body || typeof body.prompt !== 'string') {
    return {
      message:
        'Worboo needs a prompt to help – please send a `prompt` string in the request body.',
      meta: { mode: config.assistant.mode as AssistantMode, fallback: true },
    }
  }

  const model = body.model ?? ''
  const baseTokens = { prompt: body.prompt, model }
  const systemPromptRaw = config.assistant.systemPrompt ?? ''
  const renderedSystemPrompt = replaceTokens(systemPromptRaw, baseTokens)
  const context = {
    ...baseTokens,
    systemPrompt:
      typeof renderedSystemPrompt === 'string'
        ? renderedSystemPrompt
        : String(renderedSystemPrompt ?? ''),
  }

  if (config.assistant.mode === 'proxy') {
    try {
      const result = await handleProxy(config, body, fetchImpl, context)
      if (result.message) {
        return {
          message: result.message,
          meta: {
            mode: 'proxy',
            upstreamStatus: result.upstreamStatus,
          },
        }
      }
    } catch (error) {
      console.warn('[assistant-server] proxy call failed:', error)
    }
  }

  return {
    message: chooseStaticMessage(config, context),
    meta: {
      mode: config.assistant.mode,
      fallback: config.assistant.mode === 'proxy',
    },
  }
}

export const createAssistantServer = (
  config: AssistantConfig,
  deps: AssistantDependencies = {}
) => {
  const fetchImpl = deps.fetchImpl ?? defaultFetchImpl
  const startedAt = Date.now()
  const metrics = {
    totalRequests: 0,
    proxyCount: 0,
    fallbackCount: 0,
    lastRequestAt: null as number | null,
    lastDurationMs: null as number | null,
    lastStatus: null as 'success' | 'fallback' | 'error' | null,
  }

  return http.createServer(async (req, res) => {
    const url = req.url ? new URL(req.url, 'http://localhost') : undefined

    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      if (config.server.cors?.origin) {
        res.setHeader(
          'Access-Control-Allow-Origin',
          config.server.cors.origin
        )
      }
      if (config.server.cors?.allowHeaders) {
        res.setHeader(
          'Access-Control-Allow-Headers',
          config.server.cors.allowHeaders.join(', ')
        )
      }
      if (config.server.cors?.allowMethods) {
        res.setHeader(
          'Access-Control-Allow-Methods',
          config.server.cors.allowMethods.join(', ')
        )
      }
      res.end()
      return
    }

    if (!url) {
      jsonResponse(
        res,
        404,
        { error: 'Not Found' },
        config.server.cors?.origin,
        config.server.cors?.allowHeaders,
        config.server.cors?.allowMethods
      )
      return
    }

    if (url.pathname === '/healthz') {
      jsonResponse(
        res,
        200,
        {
          status: 'ok',
          mode: config.assistant.mode,
          totalRequests: metrics.totalRequests,
          proxyCount: metrics.proxyCount,
          fallbackCount: metrics.fallbackCount,
          lastRequestAt: metrics.lastRequestAt,
          lastDurationMs: metrics.lastDurationMs,
          lastStatus: metrics.lastStatus,
          uptimeMs: Date.now() - startedAt,
        },
        config.server.cors?.origin,
        config.server.cors?.allowHeaders,
        config.server.cors?.allowMethods
      )
      return
    }

    if (url.pathname !== '/hint') {
      jsonResponse(
        res,
        404,
        { error: 'Not Found' },
        config.server.cors?.origin,
        config.server.cors?.allowHeaders,
        config.server.cors?.allowMethods
      )
      return
    }

    if (req.method !== 'POST') {
      jsonResponse(
        res,
        405,
        { error: 'Method Not Allowed' },
        config.server.cors?.origin,
        config.server.cors?.allowHeaders,
        config.server.cors?.allowMethods
      )
      return
    }

    try {
      const requestStart = Date.now()
      const payloadRaw = await readRequestBody(req)
      const payload = payloadRaw
        ? (JSON.parse(payloadRaw) as HintRequestBody)
        : undefined

      const result = await hintResponse(config, payload, fetchImpl)
      const requestEnd = Date.now()

      metrics.totalRequests += 1
      metrics.lastRequestAt = requestEnd
      metrics.lastDurationMs = requestEnd - requestStart
      metrics.lastStatus = result.meta?.fallback
        ? 'fallback'
        : 'success'

      if (config.assistant.mode === 'proxy' && !result.meta?.fallback) {
        metrics.proxyCount += 1
      }

      if (result.meta?.fallback) {
        metrics.fallbackCount += 1
      }

      jsonResponse(
        res,
        200,
        result,
        config.server.cors?.origin,
        config.server.cors?.allowHeaders,
        config.server.cors?.allowMethods
      )
    } catch (error) {
      console.error('[assistant-server] failed to handle request', error)
      metrics.totalRequests += 1
      metrics.lastRequestAt = Date.now()
      metrics.lastDurationMs = null
      metrics.lastStatus = 'error'
      jsonResponse(
        res,
        500,
        { error: 'Internal Server Error' },
        config.server.cors?.origin,
        config.server.cors?.allowHeaders,
        config.server.cors?.allowMethods
      )
    }
  })
}

export const startAssistantServer = async (
  customPath?: string,
  deps?: AssistantDependencies
) => {
  const config = loadConfig(customPath)
  const server = createAssistantServer(config, deps)

  await new Promise<void>((resolve, reject) => {
    server.listen(config.server.port, config.server.host, () => {
      console.log(
        `[assistant-server] listening on http://${config.server.host}:${config.server.port}`
      )
      resolve()
    })
    server.on('error', (error) => {
      reject(error)
    })
  })

  return server
}

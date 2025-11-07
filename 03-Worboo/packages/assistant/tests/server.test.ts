import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AssistantConfig } from '../src/types'
import { createAssistantServer } from '../src/server'

const closeServer = (server: ReturnType<typeof createAssistantServer>) =>
  new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })

const listen = (server: ReturnType<typeof createAssistantServer>) =>
  new Promise<{ url: string }>((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (address && typeof address === 'object') {
        resolve({ url: `http://${address.address}:${address.port}` })
      } else {
        reject(new Error('Failed to start assistant server'))
      }
    })
  })

describe('assistant server', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns static messages when running in static mode', async () => {
    const config: AssistantConfig = {
      server: { host: '127.0.0.1', port: 8788 },
      assistant: {
        mode: 'static',
        staticMessages: ['Think parachains, not parachutes!'],
      },
    }

    const server = createAssistantServer(config)
    const { url } = await listen(server)

    const response = await fetch(`${url}/hint`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'Help me', model: 'demo' }),
    })

    const payload = (await response.json()) as { message: string }
    expect(response.status).toBe(200)
    expect(payload.message).toBe('Think parachains, not parachutes!')

    await closeServer(server)
  })

  it('exposes health metrics and updates after requests', async () => {
    const config: AssistantConfig = {
      server: {
        host: '127.0.0.1',
        port: 8788,
        cors: {
          enabled: true,
          origin: '*',
        },
      },
      assistant: {
        mode: 'static',
        staticMessages: ['First hint'],
      },
    }

    const server = createAssistantServer(config)
    const { url } = await listen(server)

    const healthInitial = await fetch(`${url}/healthz`)
    expect(healthInitial.status).toBe(200)
    expect(healthInitial.headers.get('access-control-allow-origin')).toBe('*')

    const initialData = (await healthInitial.json()) as Record<string, unknown>
    expect(initialData.status).toBe('ok')
    expect(initialData.mode).toBe('static')
    expect(initialData.totalRequests).toBe(0)
    expect(initialData.fallbackCount).toBe(0)
    expect(initialData.proxyCount).toBe(0)
    expect(initialData.lastRequestAt).toBeNull()

    await fetch(`${url}/hint`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'help', model: 'demo' }),
    })

    const healthAfter = await fetch(`${url}/healthz`)
    const afterData = (await healthAfter.json()) as Record<string, unknown>
    expect(afterData.totalRequests).toBe(1)
    expect(afterData.fallbackCount).toBe(0)
    expect(afterData.lastRequestAt).not.toBeNull()
    expect(typeof afterData.uptimeMs).toBe('number')

    await closeServer(server)
  })

  it('proxies upstream requests with template substitution', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'Hint via upstream' } }],
      }),
    })

    const config: AssistantConfig = {
      server: { host: '127.0.0.1', port: 8788 },
      assistant: {
        mode: 'proxy',
        systemPrompt: 'System {{model}}',
        staticMessages: ['Fallback hint'],
        proxy: {
          url: 'https://assistant.example/hint',
          method: 'POST',
          headers: { Authorization: 'Bearer token' },
          bodyTemplate: {
            model: '{{model}}',
            messages: [
              { role: 'system', content: '{{systemPrompt}}' },
              { role: 'user', content: '{{prompt}}' },
            ],
          },
          responsePath: ['choices', 0, 'message', 'content'],
        },
      },
    }

    const server = createAssistantServer(config, { fetchImpl })
    const { url } = await listen(server)

    const response = await fetch(`${url}/hint`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Give me a clue about Moonbase',
        model: 'moonbase-hint',
      }),
    })

    const payload = (await response.json()) as { message: string }
    expect(response.status).toBe(200)
    expect(payload.message).toBe('Hint via upstream')

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://assistant.example/hint',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          model: 'moonbase-hint',
          messages: [
            { role: 'system', content: 'System moonbase-hint' },
            {
              role: 'user',
              content: 'Give me a clue about Moonbase',
            },
          ],
        }),
      })
    )

    await closeServer(server)
  })

  it('falls back to static messages when proxy fails', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'upstream failed' }),
    })

    const config: AssistantConfig = {
      server: { host: '127.0.0.1', port: 8788 },
      assistant: {
        mode: 'proxy',
        staticMessages: ['Fallback hint'],
        proxy: {
          url: 'https://assistant.example/hint',
          responsePath: ['message'],
        },
      },
    }

    const server = createAssistantServer(config, { fetchImpl })
    const { url } = await listen(server)

    const response = await fetch(`${url}/hint`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'word', model: 'demo' }),
    })

    const payload = (await response.json()) as { message: string }
    expect(response.status).toBe(200)
    expect(payload.message).toBe('Fallback hint')

    const health = await fetch(`${url}/healthz`)
    const healthData = (await health.json()) as Record<string, unknown>
    expect(healthData.totalRequests).toBe(1)
    expect(healthData.fallbackCount).toBe(1)
    expect(healthData.proxyCount).toBe(0)

    await closeServer(server)
  })
})

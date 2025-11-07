export type StaticAssistantMode = 'static'
export type ProxyAssistantMode = 'proxy'

export type AssistantMode = StaticAssistantMode | ProxyAssistantMode

export type ResponsePathSegment = string | number

export interface AssistantProxyConfig {
  url: string
  method?: string
  headers?: Record<string, string>
  bodyTemplate?: unknown
  responsePath?: ResponsePathSegment[]
  timeoutMs?: number
}

export interface AssistantConfig {
  server: {
    host: string
    port: number
    cors?: {
      enabled: boolean
      origin: string | string[]
      allowHeaders?: string[]
      allowMethods?: string[]
    }
  }
  assistant: {
    mode: AssistantMode
    staticMessages?: string[]
    systemPrompt?: string
    proxy?: AssistantProxyConfig
  }
}

export interface HintRequestBody {
  prompt: string
  model?: string
}

export interface HintResponse {
  message: string
  meta?: {
    mode: AssistantMode
    upstreamStatus?: number
    fallback?: boolean
  }
}

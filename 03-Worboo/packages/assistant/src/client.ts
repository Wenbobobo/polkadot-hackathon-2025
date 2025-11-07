import { URL } from 'url'

export interface RequestHintOptions {
  endpoint: string
  prompt: string
  model?: string
  headers?: Record<string, string>
  fetchImpl?: typeof fetch
}

export interface RequestHintResult {
  message: string
  meta?: Record<string, unknown>
}

export const requestHint = async ({
  endpoint,
  prompt,
  model,
  headers = {},
  fetchImpl = fetch,
}: RequestHintOptions): Promise<RequestHintResult> => {
  if (!endpoint) {
    throw new Error('[assistant-client] endpoint is required')
  }

  if (!prompt) {
    throw new Error('[assistant-client] prompt is required')
  }

  const url = new URL(endpoint)
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({
      prompt,
      model,
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `[assistant-client] request failed (${response.status}): ${text}`
    )
  }

  const payload = (await response.json()) as RequestHintResult
  if (!payload || typeof payload.message !== 'string') {
    throw new Error('[assistant-client] response missing `message` field')
  }

  return payload
}

import { describe, expect, it } from 'vitest'

import { requestHint } from '../src/client'

describe('requestHint', () => {
  it('sends POST request with prompt/model and returns message', async () => {
    const fetchMock = async (input: RequestInfo | URL, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(init.body as string) : {}

      expect(input.toString()).toBe('http://127.0.0.1:8788/hint')
      expect(init?.method).toBe('POST')
      expect(init?.headers).toMatchObject({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      })
      expect(body).toEqual({
        prompt: 'Give me a hint',
        model: 'moonbase-hint',
      })

      return {
        ok: true,
        status: 200,
        json: async () => ({
          message: 'Here is a hint',
          meta: { upstreamStatus: 200 },
        }),
      } as Response
    }

    const result = await requestHint({
      endpoint: 'http://127.0.0.1:8788/hint',
      prompt: 'Give me a hint',
      model: 'moonbase-hint',
      headers: { Authorization: 'Bearer token' },
      fetchImpl: fetchMock,
    })

    expect(result).toEqual({
      message: 'Here is a hint',
      meta: { upstreamStatus: 200 },
    })
  })

  it('throws when response is not ok', async () => {
    const fetchMock = async () =>
      ({
        ok: false,
        status: 500,
        text: async () => 'upstream error',
      }) as Response

    await expect(
      requestHint({
        endpoint: 'http://127.0.0.1:8788/hint',
        prompt: 'bad request',
        fetchImpl: fetchMock,
      })
    ).rejects.toThrow('[assistant-client] request failed (500): upstream error')
  })
})

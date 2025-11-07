/** @jest-environment node */

import fetch, { Headers, Response } from 'node-fetch'
import { createMockAssistantServer } from '../mockAssistantServer'

// Polyfill minimal fetch & headers for the Node test environment.
;(global as any).fetch = fetch
;(global as any).Headers = Headers

describe('mockAssistantServer', () => {
  it('serves sequential hints with CORS headers', async () => {
    const server = createMockAssistantServer({
      responseDelayMs: 5,
      messages: [
        { message: 'Hint one' },
        { message: 'Hint two' },
      ],
    })

    const running = await server.start()

    const first = await fetch(running.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'first' }),
    }).then((res: Response) => {
      expect(res.headers.get('access-control-allow-origin')).toBe('*')
      return res.json()
    })

    expect(first).toEqual({ message: 'Hint one' })

    const second = await fetch(running.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'second' }),
    }).then((res: Response) => res.json())

    expect(second).toEqual({ message: 'Hint two' })

    await running.stop()
  })
})

import { createServer, IncomingMessage, ServerResponse } from 'http'
import { AddressInfo } from 'net'

export type MockAssistantOptions = {
  port?: number
  responseDelayMs?: number
  corsOrigin?: string
  messages?: Array<Record<string, unknown>>
}

export type RunningAssistantServer = {
  url: string
  port: number
  stop: () => Promise<void>
}

export const createMockAssistantServer = ({
  port = 0,
  responseDelayMs = 0,
  corsOrigin = '*',
  messages = [{ message: 'Worboo mock hint: think about Moonbase!' }],
}: MockAssistantOptions = {}) => {
  let nextIndex = 0

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (corsOrigin) {
      res.setHeader('Access-Control-Allow-Origin', corsOrigin)
    }

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Custom')
      res.writeHead(204)
      res.end()
      return
    }

    if (req.method !== 'POST') {
      res.writeHead(405)
      res.end(JSON.stringify({ error: 'method_not_allowed' }))
      return
    }

    await new Promise<void>((resolve) => {
      req.on('data', () => undefined)
      req.on('end', () => resolve())
    })

    if (responseDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, responseDelayMs))
    }

    const payload = messages[nextIndex % messages.length]
    nextIndex += 1

    res.setHeader('Content-Type', 'application/json')
    res.writeHead(200)
    res.end(JSON.stringify(payload))
  })

  const start = async (): Promise<RunningAssistantServer> =>
    new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(port, () => {
        const address = server.address() as AddressInfo
        resolve({
          url: `http://127.0.0.1:${address.port}`,
          port: address.port,
          stop: () =>
            new Promise<void>((stopResolve, stopReject) => {
              server.close((err) => {
                if (err) stopReject(err)
                else stopResolve()
              })
            }),
        })
      })
    })

  return { start }
}

#!/usr/bin/env node
#!/usr/bin/env node
const http = require('http')
const minimist = require('minimist')

const args = minimist(process.argv.slice(2), {
  string: ['port', 'delay', 'messages', 'cors'],
  default: {
    port: process.env.MOCK_ASSISTANT_PORT || '8788',
    delay: process.env.MOCK_ASSISTANT_DELAY_MS || '0',
    messages: process.env.MOCK_ASSISTANT_MESSAGES || '',
    cors: process.env.MOCK_ASSISTANT_CORS || '*',
  },
})

const parseMessages = (input) => {
  if (!input) return [{ message: 'Worboo mock hint: think about Moonbase!' }]
  try {
    const parsed = JSON.parse(input)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch (error) {
    console.warn('[mock-assistant] Failed to parse messages JSON, falling back to default.')
  }
  return [{ message: 'Worboo mock hint: think about Moonbase!' }]
}

const messages = parseMessages(args.messages)
let pointer = 0

const server = http.createServer(async (req, res) => {
  if (args.cors) {
    res.setHeader('Access-Control-Allow-Origin', args.cors)
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

  await new Promise((resolve) => {
    req.on('data', () => undefined)
    req.on('end', () => resolve())
  })

  const delay = Number(args.delay)
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  const payload = messages[pointer % messages.length]
  pointer += 1

  res.setHeader('Content-Type', 'application/json')
  res.writeHead(200)
  res.end(JSON.stringify(payload))
})

const port = Number(args.port)
server.listen(port, () => {
  const address = server.address()
  const actualPort = typeof address === 'object' && address ? address.port : port
  console.log(`[mock-assistant] listening on http://127.0.0.1:${actualPort}`)
  console.log('[mock-assistant] Press Ctrl+C to stop.')
})

process.on('SIGINT', () => {
  console.log('\n[mock-assistant] shutting down...')
  server.close(() => process.exit(0))
})

import { startAssistantServer } from './server'

startAssistantServer().catch((error) => {
  console.error('[assistant-server] failed to start', error)
  process.exitCode = 1
})

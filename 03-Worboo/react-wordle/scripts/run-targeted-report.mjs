import { spawn } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const tests = [
  'src/hooks/__tests__/useRelayerNotifications.test.tsx',
  'src/hooks/__tests__/useRelayerHealth.test.tsx',
  'src/hooks/__tests__/useWorbooAssistant.test.tsx',
  'src/hooks/__tests__/useWorbooPlayer.test.tsx',
  'src/components/navbar/__tests__/RelayerStatusBanner.test.tsx',
  'src/components/navbar/__tests__/registrationState.test.ts',
  'src/utils/__tests__/shop.test.ts',
  'src/lib/words.test.ts',
  'src/lib/statuses.test.ts',
]

const reportDir = resolve(process.cwd(), 'reports')
const reportPath = resolve(reportDir, 'frontend-targeted.json')
mkdirSync(reportDir, { recursive: true })

const binCandidates = [
  resolve(process.cwd(), 'node_modules', '.bin'),
  resolve(process.cwd(), '..', 'node_modules', '.bin'),
  resolve(process.cwd(), '..', '..', 'node_modules', '.bin'),
]

const binDir = binCandidates.find((dir) => existsSync(dir))
if (!binDir) {
  console.error('[vitest-report] Unable to locate local vitest binary.')
  process.exit(1)
}

const vitestBin = resolve(
  binDir,
  process.platform === 'win32' ? 'vitest.cmd' : 'vitest'
)

const args = [
  'run',
  '--passWithNoTests',
  '--reporter',
  'default',
  '--reporter',
  'json',
  '--outputFile',
  reportPath,
  ...tests,
]

const child = spawn(vitestBin, args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

child.on('close', (code) => {
  process.exit(code ?? 1)
})

import { loadConfig } from './config.js'
import { LeaderboardService } from './leaderboard.js'

const run = async () => {
  const config = loadConfig()
  const service = new LeaderboardService(config)
  await service.sync()
  const leaderboard = service.getLeaderboard(20)
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), leaderboard }, null, 2))
}

run().catch((error) => {
  console.error('[worboo-indexer] snapshot failed', error)
  process.exitCode = 1
})

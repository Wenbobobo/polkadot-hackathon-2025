import express from 'express'
import pino from 'pino'
import { loadConfig } from './config.js'
import { LeaderboardService } from './leaderboard.js'

const logger = pino({ name: 'worboo-indexer' })
const config = loadConfig()
const service = new LeaderboardService(config)

const createServer = async () => {
  await service.sync()

  const app = express()
  app.get('/leaderboard', (req, res) => {
    const limit = Number(req.query.limit ?? 10)
    res.json({
      limit,
      items: service.getLeaderboard(limit),
      lastBlock: config.fromBlock,
    })
  })

  app.get('/players/:address', (req, res) => {
    const stats = service.getPlayer(req.params.address)
    if (!stats) {
      res.status(404).json({ error: 'Player not found' })
      return
    }
    res.json(stats)
  })

  app.get('/healthz', (_req, res) => {
    res.json({
      status: 'ok',
      registry: config.registryAddress,
      rpcUrl: config.rpcUrl,
    })
  })

  app.listen(config.http.port, config.http.host, () => {
    logger.info(
      `Leaderboard API listening at http://${config.http.host}:${config.http.port}`
    )
  })
}

createServer().catch((error) => {
  logger.error({ err: error }, 'Indexer failed to start')
  process.exitCode = 1
})

import fs from 'fs'
import { Interface, JsonRpcProvider, Log } from 'ethers6'
import type { GameRecord, PlayerStats } from './types.js'
import type { IndexerConfig } from './config.js'

const GAME_RECORDED_ABI = [
  'event GameRecorded(address indexed player,uint64 indexed dayId,bytes32 wordHash,uint8 guesses,bool victory,uint64 streak,uint64 totalGames,uint64 totalWins)',
]

const registryInterface = new Interface(GAME_RECORDED_ABI)
const eventTopic = registryInterface.getEventTopic('GameRecorded')

type CacheFile = {
  lastSyncedBlock: number
  records: GameRecord[]
}

export class LeaderboardService {
  private provider: JsonRpcProvider
  private config: IndexerConfig
  private cache: CacheFile
  private stats: Map<string, PlayerStats>

  constructor(config: IndexerConfig) {
    this.config = config
    if (!this.config.registryAddress || /^0x0+$/.test(this.config.registryAddress)) {
      throw new Error(
        'Worboo indexer requires a valid registry address. Set WORBOO_INDEXER_REGISTRY or update config/indexer.config.json.'
      )
    }
    this.provider = new JsonRpcProvider(config.rpcUrl)
    this.cache = this.loadCache()
    this.stats = new Map()
    this.cache.records.forEach((record) => {
      this.applyRecord(record)
    })
  }

  private loadCache(): CacheFile {
    try {
      const raw = fs.readFileSync(this.config.cachePath, 'utf-8')
      return JSON.parse(raw) as CacheFile
    } catch {
      return { lastSyncedBlock: this.config.fromBlock, records: [] }
    }
  }

  private persistCache() {
    fs.mkdirSync(require('path').dirname(this.config.cachePath), { recursive: true })
    fs.writeFileSync(this.config.cachePath, JSON.stringify(this.cache, null, 2))
  }

  private async getBlockTimestamp(blockNumber: number) {
    const block = await this.provider.getBlock(blockNumber)
    return block?.timestamp ? Number(block.timestamp * 1000n) : Date.now()
  }

  private async decodeLogs(logs: Log[]) {
    const records: GameRecord[] = []
    for (const log of logs) {
      const decoded = registryInterface.decodeEventLog(
        'GameRecorded',
        log.data,
        log.topics
      )
      const timestamp = await this.getBlockTimestamp(Number(log.blockNumber))
      records.push({
        player: decoded.player.toLowerCase(),
        dayId: Number(decoded.dayId),
        victory: Boolean(decoded.victory),
        streak: Number(decoded.streak),
        totalGames: Number(decoded.totalGames),
        totalWins: Number(decoded.totalWins),
        blockNumber: Number(log.blockNumber),
        transactionHash: log.transactionHash,
        timestamp,
      })
    }
    return records
  }

  private applyRecord(record: GameRecord) {
    const entry =
      this.stats.get(record.player) ??
      ({
        address: record.player,
        totalGames: 0,
        totalWins: 0,
        currentStreak: 0,
        lastGameDayId: 0,
        lastSeenAt: 0,
      } as PlayerStats)

    entry.totalGames = record.totalGames
    entry.totalWins = record.totalWins
    entry.currentStreak = record.streak
    entry.lastGameDayId = record.dayId
    entry.lastSeenAt = record.timestamp

    this.stats.set(record.player, entry)
  }

  private async fetchLogs(fromBlock: number, toBlock: number) {
    return this.provider.getLogs({
      address: this.config.registryAddress,
      topics: [eventTopic],
      fromBlock,
      toBlock,
    })
  }

  async sync(rangeSize = 2_000) {
    const latestBlock = await this.provider.getBlockNumber()
    let cursor = this.cache.lastSyncedBlock

    while (cursor < latestBlock) {
      const toBlock = Math.min(cursor + rangeSize, latestBlock)
      const logs = await this.fetchLogs(cursor + 1, toBlock)
      const records = await this.decodeLogs(logs)
      records.forEach((record) => {
        this.cache.records.push(record)
        this.applyRecord(record)
      })

      cursor = toBlock
      this.cache.lastSyncedBlock = cursor
    }

    this.persistCache()
  }

  getLeaderboard(limit = 10): PlayerStats[] {
    return Array.from(this.stats.values())
      .sort((a, b) => {
        if (b.currentStreak !== a.currentStreak) {
          return b.currentStreak - a.currentStreak
        }
        if (b.totalWins !== a.totalWins) {
          return b.totalWins - a.totalWins
        }
        return b.lastSeenAt - a.lastSeenAt
      })
      .slice(0, limit)
  }

  getPlayer(address: string) {
    return this.stats.get(address.toLowerCase()) ?? null
  }
}

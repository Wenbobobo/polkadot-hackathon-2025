export type GameRecordedEvent = {
  player: string
  dayId: bigint
  guesses: number
  victory: boolean
  streak: bigint
  totalWins: bigint
  totalGames: bigint
  timestamp?: bigint
}

export type LeaderboardEntry = {
  player: string
  streak: number
  totalWins: number
  totalGames: number
  losses: number
  victoryRate: number
  lastDayId: number
  lastUpdatedAt: number
}

export type ComputeOptions = {
  limit?: number
}

const toNumber = (value: bigint | number | undefined, fallback = 0) => {
  if (typeof value === "number") return value
  if (typeof value === "bigint") return Number(value)
  return fallback
}

export const computeLeaderboard = (
  events: GameRecordedEvent[],
  options: ComputeOptions = {}
): LeaderboardEntry[] => {
  const latestByPlayer = new Map<string, GameRecordedEvent>()

  for (const event of events) {
    const existing = latestByPlayer.get(event.player)
    if (!existing) {
      latestByPlayer.set(event.player, event)
      continue
    }

    const existingGames = toNumber(existing.totalGames)
    const currentGames = toNumber(event.totalGames)

    if (currentGames > existingGames) {
      latestByPlayer.set(event.player, event)
      continue
    }

    if (
      currentGames === existingGames &&
      toNumber(event.dayId) >= toNumber(existing.dayId)
    ) {
      latestByPlayer.set(event.player, event)
    }
  }

  const entries: LeaderboardEntry[] = Array.from(latestByPlayer.values()).map(
    (event) => {
      const totalGames = Math.max(0, toNumber(event.totalGames))
      const totalWins = Math.max(0, toNumber(event.totalWins))
      const losses = Math.max(0, totalGames - totalWins)
      const victoryRate =
        totalGames === 0 ? 0 : Number((totalWins / totalGames).toFixed(4))
      const lastUpdatedAt = toNumber(event.timestamp)

      return {
        player: event.player,
        streak: Math.max(0, toNumber(event.streak)),
        totalWins,
        totalGames,
        losses,
        victoryRate,
        lastDayId: Math.max(0, toNumber(event.dayId)),
        lastUpdatedAt,
      }
    }
  )

  entries.sort((a, b) => {
    if (b.streak !== a.streak) return b.streak - a.streak
    if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins
    if (b.totalGames !== a.totalGames) return b.totalGames - a.totalGames
    return a.player.localeCompare(b.player)
  })

  const limit = options.limit ?? entries.length
  return entries.slice(0, limit)
}

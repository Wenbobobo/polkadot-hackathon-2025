export type GameRecord = {
  player: string
  dayId: number
  victory: boolean
  streak: number
  totalGames: number
  totalWins: number
  blockNumber: number
  transactionHash: string
  timestamp: number
}

export type PlayerStats = {
  address: string
  totalGames: number
  totalWins: number
  currentStreak: number
  lastGameDayId: number
  lastSeenAt: number
}

import { expect } from "chai"
import { computeLeaderboard, GameRecordedEvent } from "../utils/leaderboard"

const event = (
  player: string,
  dayId: number,
  streak: number,
  totalWins: number,
  totalGames: number,
  victory: boolean,
  timestamp = 1
): GameRecordedEvent => ({
  player,
  dayId: BigInt(dayId),
  guesses: 4,
  victory,
  streak: BigInt(streak),
  totalWins: BigInt(totalWins),
  totalGames: BigInt(totalGames),
  timestamp: BigInt(timestamp),
})

describe("Leaderboard utilities", () => {
  it("keeps the most recent snapshot per player", () => {
    const events: GameRecordedEvent[] = [
      event("0xAlice", 1, 1, 1, 1, true, 10),
      event("0xBob", 1, 2, 2, 2, true, 20),
      event("0xAlice", 2, 0, 1, 2, false, 30),
    ]

    const leaderboard = computeLeaderboard(events)

    expect(leaderboard).to.have.length(2)
    const alice = leaderboard.find((entry) => entry.player === "0xAlice")!
    expect(alice.totalGames).to.equal(2)
    expect(alice.streak).to.equal(0)
    expect(alice.losses).to.equal(1)
    expect(alice.lastDayId).to.equal(2)
    expect(alice.lastUpdatedAt).to.equal(30)
    expect(alice.victoryRate).to.equal(0.5)
  })

  it("sorts by streak, wins, games, then address", () => {
    const events: GameRecordedEvent[] = [
      event("0xCharlie", 4, 3, 5, 6, true),
      event("0xAlpha", 5, 3, 6, 7, true),
      event("0xBravo", 6, 2, 5, 5, true),
      event("0xDelta", 7, 3, 6, 7, true),
    ]

    const leaderboard = computeLeaderboard(events)

    expect(leaderboard.map((entry) => entry.player)).to.deep.equal([
      "0xAlpha",
      "0xDelta",
      "0xCharlie",
      "0xBravo",
    ])
  })

  it("applies the limit option", () => {
    const events: GameRecordedEvent[] = [
      event("0x01", 1, 1, 1, 1, true),
      event("0x02", 1, 2, 2, 2, true),
      event("0x03", 1, 3, 3, 3, true),
    ]

    const leaderboard = computeLeaderboard(events, { limit: 2 })
    expect(leaderboard).to.have.length(2)
    expect(leaderboard[0].player).to.equal("0x03")
  })
})

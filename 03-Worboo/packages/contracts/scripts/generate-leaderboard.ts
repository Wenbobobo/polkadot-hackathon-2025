import { ethers, network } from "hardhat"
import { computeLeaderboard } from "../utils/leaderboard"

type CLIOptions = {
  registry?: string
  from?: string
  to?: string
  limit?: string
}

const parseArgs = (): CLIOptions => {
  const args = process.argv.slice(2)
  const options: CLIOptions = {}

  for (let i = 0; i < args.length; i += 1) {
    const [key, value] = args[i].split("=")
    if (!value) continue
    if (key === "--registry") options.registry = value
    if (key === "--from") options.from = value
    if (key === "--to") options.to = value
    if (key === "--limit") options.limit = value
  }

  return options
}

async function main() {
  const { registry, from, to, limit } = parseArgs()
  const registryAddress =
    registry ??
    process.env.REGISTRY_ADDRESS ??
    process.env.WORBOO_REGISTRY_ADDRESS

  if (!registryAddress) {
    throw new Error(
      "Missing registry address. Pass --registry=0x... or set REGISTRY_ADDRESS."
    )
  }

  const contract = await ethers.getContractAt("WorbooRegistry", registryAddress)
  const filter = contract.filters.GameRecorded()

  const fromBlock = from ? Number(from) : undefined
  const toBlock = to ? Number(to) : undefined

  const events = await contract.queryFilter(filter, fromBlock, toBlock)
  const provider = ethers.provider

  const enriched = await Promise.all(
    events.map(async (event) => {
      const block = await provider.getBlock(event.blockNumber)
      return {
        player: event.args.player,
        dayId: event.args.dayId,
        guesses: event.args.guesses,
        victory: event.args.victory,
        streak: event.args.streak,
        totalWins: event.args.totalWins,
        totalGames: event.args.totalGames,
        timestamp: block ? BigInt(block.timestamp) : undefined,
      }
    })
  )

  const entries = computeLeaderboard(enriched, {
    limit: limit ? Number(limit) : undefined,
  })

  const output = {
    generatedAt: new Date().toISOString(),
    network: network.name,
    registry: registryAddress,
    totalPlayers: entries.length,
    entries,
  }

  console.log(JSON.stringify(output, null, 2))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

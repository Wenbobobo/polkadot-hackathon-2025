# Worboo Handoff Notes (2025-10-27)

## Current Snapshot

- **Contracts**: `WorbooRegistry`, `WorbooToken`, `WorbooShop` deployed via Ignition module with roles wired (`packages/contracts/ignition/modules/WorbooModule.ts`). Gas + coverage baselines captured and referenced in the testing matrix.
- **Frontend**: React app connects to Moonbase Alpha, shows deterministic Polka IDs + activity heatmaps in the profile sidebar, exposes friend search with shareable IDs, surfaces relayer health, and routes the new stats modal (daily progress, share CTA, next-word) through `useWorbooAssistant` fallbacks.
- **Relayer**: `packages/relayer` watches `GameRecorded`, persists processed hashes, exposes `/healthz` + `npm run status`, rotates structured JSON logs, and passes the Hardhat-backed integration replay.
- **CI/CD**: `.github/workflows/ci.yml` runs lint, contracts tests, relayer vitest, and targeted CRA suites on every push/PR (Husky disabled for automation safety).
- **Docs**: README, deployment guides (EN + 中文), observability notes, roadmap, and hackathon collateral refreshed for the Moonbase relayer workflow.

## Gaps Before “Full Flow” Demo

1. **CI artifacts** – workflow runs tests but skips publishing coverage/gas snapshots; judges will expect LCOV and gas reports attached to releases.
2. **Indexer/leaderboard** – gameplay history is still read live from the contracts. Subsquid/SubQuery (or The Graph) will unlock streak leaderboards and analytics.
3. **ZK proof integration** – the Halo2 proof-of-play pipeline remains out of band; stats modal advertises the roadmap until the IPFS attestation flow returns.
4. **Security hardening** – expand beyond role gating (timelocks, multisig admin, pause playbooks) before mainnet.
5. **Frontend modernization** – CRA toolchain persists; Vite/Vitest migration will simplify tests and reduce build flake.
6. **Assistant backend** – `useWorbooAssistant` is ready for a configurable LLM endpoint once an inference service is provisioned.

## Focus for Next Contributors

- **Short term**: export coverage + gas artifacts from CI, document how to share them with judges, and script cache purges/recovery drills for the relayer.
- **Medium term**: ship the indexed leaderboard service, plug a hosted LLM endpoint into `useWorbooAssistant`, feed relayer `/healthz` data into Grafana/Prometheus, and formalize on-call runbooks.
- **Long term**: merge Halo2 proof validation (flip `zkProofsEnabled`), experiment with PVM/ink! sidecar pallets, and design governance/economic levers for community seasons.

## Reference Commands

| Task | Command |
| --- | --- |
| Monorepo lint | `npm run lint` |
| Deploy contracts | `npx hardhat ignition deploy ./ignition/modules/WorbooModule.ts --network moonbase` |
| Export addresses | `npm run export:addresses` (packages/contracts) |
| Coverage & gas evidence | `npm run report:evidence` (packages/contracts) → artifacts in `build/reports/` |
| Grant relayer role | `npx hardhat run --network moonbase scripts/grantGameMaster.ts <token> <relayer>` |
| Run relayer | `npm run start` (packages/relayer) |
| Docker build | docker build -f packages/relayer/Dockerfile -t worboo-relayer . |
| Docker run | docker run --rm -p 8787:8787 -v D:\zWenbo\AI\Hackthon\polkadot-hackathon-2025\03-Worboo/packages/relayer/config:/app/packages/relayer/config -e RELAYER_CONFIG_PATH=/app/packages/relayer/config/relayer.config.json worboo-relayer |
| PM2 (optional) | pm2 start packages/relayer/ecosystem.config.cjs |
| Frontend tests | `npm test -- --watch=false --testPathPattern="(shop|contracts|words|RelayerStatusBanner|useRelayerNotifications|useWorbooAssistant)"` |

## Contacts / Notes

- Keep private keys in `.env`/config files only; never commit.
- DEV faucet: https://faucet.moonbeam.network/
- Block explorer: https://moonbase.moonscan.io/
- For production: consider swapping to Moonbeam RPCs and revisiting gas estimates (Moonbase uses 1 gwei baseline).

Continue iterating, and log major decisions back into this document or the roadmap so future teammates stay aligned. Good luck! 🟩🟨⬛





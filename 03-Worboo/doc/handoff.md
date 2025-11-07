# Worboo Handoff Notes (2025-11-06)

## Current Snapshot

- **Contracts**: `WorbooRegistry`, `WorbooToken`, `WorbooShop` deployed via Ignition (`packages/contracts/ignition/modules/WorbooModule.ts`) with role helpers (`scripts/grantGameMaster.ts`). Latest coverage + gas baselines produced through `npm run report:evidence`, and the new leaderboard generator (`npm run leaderboard`) snapshots on-chain performance for demos.
- **Frontend**: React app targets Moonbase Alpha, renders deterministic Polka IDs, activity heatmaps, badge gallery, friend search, relayer health banner, refreshed stats modal, and the `useWorbooAssistant` hook with configurable production endpoints. The build now runs on Vite/Vitest with a scripted targeted suite.
- **Relayer**: `packages/relayer` streams `GameRecorded`, dedupes & persists hashes, retries mint failures, serves `/healthz`, exposes `npm run status`, and emits rotated JSONL logs. Hardhat-backed integration replay remains green.
- **Assistant service**: `packages/assistant` ships a JSON-configured backend with static + proxy modes (plus `/healthz` metrics for dashboards), letting demos run offline or forward to a hosted LLM via `proxy.url`.
- **CI/CD**: `.github/workflows/ci.yml` executes lint, contracts tests (incl. coverage trigger), relayer Vitest, and the targeted frontend Vitest suite, surfacing failing artefacts while skipping Husky in automation contexts.
- **Docs**: README, deployment guides (EN/中文), observability playbook, roadmap, AI assistant notes, and testing matrix all reflect the Moonbase flow and relayer/leaderboard tooling as of this update.

## Gaps Before “Full Flow” Demo

1. **Coverage & gas artifacts** – CI runs the suites but still needs to archive LCOV + gas outputs for judges (`packages/contracts/build/reports/**`).
2. **Indexer/leaderboard service** – gameplay history is read live from contracts; bootstrap Subsquid/SubQuery (see `packages/indexer/README.md`) to unlock streak analytics.
3. **Assistant backend** – `useWorbooAssistant` ships with config scaffolding; wire a hosted LLM/hint API and extend tests to cover authenticated requests.
4. **ZK proof integration** – Halo2 pipeline remains staged; stats modal keeps the “coming soon” copy until off-chain verification returns.
5. **Security hardening** – beyond role gating, add pausable controls, multi-sig admin paths, and relayer cache recovery drills pre-mainnet.
6. **Frontend coverage expansion** – extend Vitest/RTL beyond the targeted suite (shop purchases, profile sidebar) and consider end-to-end smoke tests once Moonbase rehearsals stabilise.

## Focus for Next Contributors

- **Short term**: archive coverage/gas artifacts in CI, validate Moonbase rehearsal using the leaderboard snapshot + relayer health, and document recovery drills plus cache reset steps.
- **Medium term**: deliver the indexed leaderboard, integrate the hosted assistant API (include auth header configuration), feed `/healthz` metrics into Grafana/Prometheus, and flesh out on-call runbooks.
- **Long term**: reinstate Halo2 proof validation (`zkProofsEnabled`), explore PVM/ink! companions, and evolve governance/economic loops for seasonal play.

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
| Frontend tests | `npm run test:targeted` (react-wordle) |
| Frontend report | `npm run test:targeted:report` (react-wordle) |
| Leaderboard snapshot | `npm run leaderboard -- --registry=0x... --limit=10` (packages/contracts) |

## Contacts / Notes

- Keep private keys in `.env`/config files only; never commit.
- DEV faucet: https://faucet.moonbeam.network/
- Block explorer: https://moonbase.moonscan.io/
- For production: consider swapping to Moonbeam RPCs and revisiting gas estimates (Moonbase uses 1 gwei baseline).

Continue iterating, and log major decisions back into this document or the roadmap so future teammates stay aligned. Good luck! 🟩🟨⬛

---

_Last updated: 2025-11-06 (post-doc review + leaderboard tooling refresh)._





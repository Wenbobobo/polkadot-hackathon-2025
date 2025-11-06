# Worboo Polkadot Hackathon Implementation Plan

## Milestone 0 – Environment Setup (Day 0)
- [x] Initialize `packages/contracts` Hardhat workspace (TypeScript).
- [x] Install OpenZeppelin/contracts, hardhat-toolbox, dotenv, @nomicfoundation/hardhat-ignition.
- [x] Configure networks: `hardhat`, `moonbase` (RPC + chainId 1287), `moonbeam`.
- [x] Generate `.env.example` with `PRIVATE_KEY`, `MOONBASE_RPC`, `MOONBEAM_RPC`.
- [ ] Add shared formatting/linting config (workspace-level Prettier/ESLint) and evaluate `pnpm` glue if needed.

## Milestone 1 – Core Contracts (Day 1–2)
- [x] Scaffold `WorbooRegistry`, `WorbooToken`, `WorbooShop` contracts (OpenZeppelin-based).
- [x] Write Foundry unit tests (e.g., `test/WorbooRegistry.t.sol`, etc.).
- [x] Add Hardhat deployment scripts + Ignition module.
- [x] Run gas snapshot + coverage (`forge coverage`, `npx hardhat coverage`).

## Milestone 2 – Frontend Integration (Day 2–3)
- [x] Replace `wagmi` config with Moonbase endpoints.
- [x] Create `src/services/contracts.ts` to instantiate ethers.js contracts.
- [x] Implement hooks/components: balances, inventory, purchase flow.
- [x] Add tests covering new services (shop utilities, contracts config).

## Milestone 3 – Docs & DX (Day 3)
- [x] Rewrite root `README.md` to reflect Polkadot focus, setup steps, deployment instructions.
- [x] Update `doc/README - polkadot.md` with new narrative + architecture highlights.
- [x] Document testing commands and contribution workflow.
- [x] Prepare demo walkthrough script.

## Milestone 4 – Relayer Reliability (Day 4)
- [x] Persist processed `GameRecorded` identifiers across restarts to avoid double minting.
- [x] Add configurable retry/backoff strategy for failed mint transactions.
- [x] Extend relayer unit tests to cover persistence and failure recovery (TDD).
- [x] Update deployment guide with relayer storage/operations notes.

## Milestone 5 – Player Feedback & Monitoring (Day 5)
- [x] Surface relayer success/failure notifications in the React UI (e.g., navbar toast/log).
- [x] Cover the new UX with React Testing Library specs guarding hooks/components.
- [x] Add lightweight telemetry hooks (structured logger + `npm run status` snapshot) for hackathon demos.

## Milestone 6 – Quality Gates (Day 5–6)
- [x] Capture contract gas snapshot + coverage report (`forge coverage`, `npx hardhat coverage`).
- [x] Wire relayer tests into CI (vitest) and document command in README.
- [ ] Audit frontend test commands, modernise Jest/Vitest config once CRA migration begins.

## Optional Stretch
- [ ] Simple Subsquid/SubQuery indexer for leaderboards.
- [x] Off-chain relayer prototype for auto minting rewards.
- [ ] UI polish for wallet onboarding (Talisman/Polkadot{.js} support).
- [ ] React/Vite migration to retire legacy CRA tooling.

## Milestone 7 – Frontend Polish v2 (Day 6–7)
- [x] Refine stats modal with daily progress, share CTA, next-word flow, and ZK “coming soon” messaging.
- [x] Replace legacy OCID references with Polka IDs, deterministic activity heatmaps, and badge galleries in the profile/friends UI.
- [x] Introduce `useWorbooAssistant` hook + config scaffolding for future LLM integrations (defaulting to curated fallback hints).

## Milestone 8 – Evidence Automation (Day 7)
- [x] Add `npm run report:evidence` to produce LCOV + gas reports under `build/reports/`.
- [x] Update CI to run the evidence command, upload artifacts, and print coverage/gas summaries.
- [x] Document artifact retrieval and test commands across README, deployment guide, and handoff notes.

## Milestone 9 – AI Assistant Backend (Next)
- [ ] Stand up a lightweight hint service (serverless or container) returning `{ message: string }`.
- [ ] Secure the endpoint (API key/JWT) and extend `useWorbooAssistant` to send auth headers.
- [ ] Add integration tests or mocks to validate end-to-end hint delivery.

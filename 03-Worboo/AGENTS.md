# Repository Guidelines

## Project Structure & Module Organization
- `packages/contracts/` hosts the Hardhat workspace; Solidity lives in `contracts/`, TypeScript tests under `test/`, and Ignition deployment modules in `ignition/`.
- `packages/relayer/` contains the TypeScript event relayer with config stubs in `config/`, source code in `src/`, and Vitest suites in `tests/`.
- `react-wordle/` is the CRA frontend; feature code is under `src/`, with hooks/components keeping colocated `__tests__` folders.
- `doc/` centralizes hackathon collateral (migration research, deployment guide, roadmap, handoff). Treat it as the canonical brief for stakeholders.

## Build, Test, and Development Commands
- `npm run lint` (root) — ESLint across contracts and relayer.
- `npm run test` (packages/contracts) — Hardhat unit tests plus TypeChain compilation.
- `npm test` (packages/relayer) — Vitest unit + integration suite; ensure contracts workspace is compiled first.
- `npm test -- --watch=false --testPathPattern="(shop|contracts|words|RelayerStatusBanner|useRelayerNotifications)"` (react-wordle) — Targeted CRA tests that avoid legacy runner pitfalls.
- `npm start` (react-wordle) — Launches the Moonbase-enabled UI on port 3000; set `PORT=3100` if the default port is busy.

## Coding Style & Naming Conventions
- Prettier (`npm run format`) enforces formatting; respect `.prettierrc.json` line width and trailing comma rules.
- TypeScript/JavaScript linting uses `.eslintrc.cjs`; prefer resolving warnings rather than silencing them.
- Solidity contracts follow PascalCase (`WorbooRegistry`), while functions/variables use camelCase. Prefix new on-chain artifacts with `Worboo`.

## Testing Guidelines
- Contracts: Hardhat + chai; mirror test filenames to contracts (e.g., `WorbooRegistry.ts`). Keep coverage ≥97% statements (see `doc/testing-matrix.md`).
- Relayer: Vitest with mocked Hardhat node; write deterministic tests that prove queue management and reward minting.
- Frontend: React Testing Library; colocate specs beside components/hooks and mock Wagmi providers for chain interactions.

## Commit & Pull Request Guidelines
- Use imperative, present-tense commit headers (e.g., `Add relayer health probes`). Group related changes per commit.
- PRs should recap intent, list commands executed (tests, lint, build), and link hackathon issues/tasks. Attach screenshots or logs for UX/ops changes.

## Security & Configuration Tips
- Never commit secrets. Use `packages/relayer/config/relayer.config.json` with `RELAYER_CONFIG_PATH` overrides instead of raw env vars.
- Grant `GAME_MASTER_ROLE` only to automation wallets operating the relayer. Rotate RPC keys after demos and keep Moonbase faucets in reserve.
- Log files (`.logs/`) and caches (`.cache/`) may be generated; add them to `.gitignore` when creating new variants.

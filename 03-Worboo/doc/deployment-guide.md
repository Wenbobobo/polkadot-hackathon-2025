# Worboo Deployment Guide (Moonbase Alpha)

This guide walks through the complete setup required to run Worboo end-to-end during the Dot Your Future hackathon. Follow every step to deploy contracts, configure the frontend, and launch the reward relayer.

---

## 1. Prerequisites

| Item | Notes |
| --- | --- |
| Node.js | ≥ 18.x (LTS recommended) |
| npm | ≥ 8.x |
| Git | For cloning this repository |
| Wallet | MetaMask or Moonbeam-compatible wallet with **DEV** tokens |
| RPC Endpoint | `https://rpc.api.moonbase.moonbeam.network` (public) |
| Gas | Moonbase Alpha uses DEV token; request from [Moonbeam faucet](https://faucet.moonbeam.network/) |
| Private Key | Export the private key of your deployment wallet (store securely) |

> ⚠️ Keep your private keys out of version control. `.env` files are gitignored.

---

## 2. Clone & Install

```bash
git clone https://github.com/<your-fork>/worboo.git
cd worboo/03-Worboo

npm install --ignore-scripts
# or install each workspace individually:
npm install --prefix packages/contracts
npm install --prefix packages/relayer
npm install --ignore-scripts --prefix react-wordle
```

`--ignore-scripts` prevents Husky from running when the repo is installed outside of Git, while the root install bootstraps shared lint/format tooling.

---

## 3. Configure Contract Environment

1. Copy the template:
   ```bash
   cp packages/contracts/.env.example packages/contracts/.env
   ```
2. Fill the values:
```ini
PRIVATE_KEY=0xYOUR_PRIVATE_KEY              # wallet used for deployment
MOONBASE_RPC=https://rpc.api.moonbase.moonbeam.network
MOONBEAM_RPC=https://rpc.api.moonbeam.network   # optional mainnet promotion
# Optional gas overrides (defaults to 1 gwei)
MOONBASE_GAS_PRICE=1000000000
MOONBEAM_GAS_PRICE=1000000000
```
3. (Optional) Add [`MNEMONIC`] instead of `PRIVATE_KEY` if you use a seed phrase—Hardhat will prefer `PRIVATE_KEY` when both exist.

---

## 4. Compile & Test Contracts

```bash
cd packages/contracts
npm run compile
npm run test
```

All ten Hardhat tests should pass before deployment.

---

## 5. Deploy to Moonbase Alpha

```bash
# still inside packages/contracts
npx hardhat ignition deploy ./ignition/modules/WorbooModule.ts --network moonbase
```

This deploys the registry, token, and shop contracts, and wires base roles.

> **遇到 “transactions dropped” 或重试部署**：请先删除 `packages/contracts/ignition/deployments/chain-1287` 目录，再执行部署命令。Moonbase 要求至少 1 gwei 的 `gasPrice`（已在配置文件中默认设置，可通过 `MOONBASE_GAS_PRICE` 覆盖）。

### 5.1 Export Addresses for the Frontend

```bash
npm run export:addresses
```

The command prints `REACT_APP_*` lines you can paste into the frontend `.env`. Example output:
```
# Worboo contracts on Moonbase Alpha
REACT_APP_WORBOO_REGISTRY=0x...
REACT_APP_WORBOO_TOKEN=0x...
REACT_APP_WORBOO_SHOP=0x...
```

---

## 6. Configure Frontend

1. Copy the environment template:
   ```bash
   cp react-wordle/.env react-wordle/.env.local   # optional if you prefer a separate file
   ```
2. Set the values from the previous step:
   ```ini
   REACT_APP_WORBOO_REGISTRY=0x...
   REACT_APP_WORBOO_TOKEN=0x...
   REACT_APP_WORBOO_SHOP=0x...
   REACT_APP_RELAYER_HEALTH_URL=http://localhost:8787/healthz
   ```
3. Review optional feature toggles in `react-wordle/src/config/app-config.json`:
   - Leave `"shopDemoMode": true` if you are demoing without on-chain balances (purchases will be simulated).
   - Keep `"zkProofsEnabled": false` until the Halo2 proving pipeline is restored—the stats modal will display a “coming soon” notice.
   - Populate `"aiAssistant"` with your hint service URL, model, prompts, and headers if you have an external LLM endpoint (otherwise keep `"enabled": false`).
   - Environment overrides (`REACT_APP_SHOP_DEMO_MODE`, `REACT_APP_ZK_PROOFS_ENABLED`, `REACT_APP_ASSISTANT_*`) remain available but are optional—the JSON file is the source of truth for rehearsals.
3. Start the app:
   ```bash
   cd react-wordle
   npm run dev
   ```
4. Open `http://localhost:3000`, connect your Moonbase wallet, and click **Register** in the yellow banner to emit `PlayerRegistered`.

---

## 7. Grant Relayer Permissions

The relayer needs `GAME_MASTER_ROLE` to mint WBOO on behalf of players.

```bash
cd packages/contracts
npx hardhat run --network moonbase scripts/grantGameMaster.ts <tokenAddress> <relayerWallet>
```

- `<tokenAddress>` – the WorbooToken address (from export step).
- `<relayerWallet>` – the address whose private key you will place in `.env` for the relayer.

Confirm the transaction in block explorers such as https://moonbase.moonscan.io/.

---

## 8. Configure & Run the Reward Relayer (Optional but Recommended)

1. Copy the JSON config template (preferred workflow):
   ```bash
   cp packages/relayer/config/relayer.config.json.example packages/relayer/config/relayer.config.json
   ```
   Update the file with your Moonbase details:
   ```json
   {
     "rpcUrl": "https://rpc.api.moonbase.moonbeam.network",
     "privateKey": "0xRELAYER_PRIVATE_KEY",
     "registryAddress": "0x...",
     "tokenAddress": "0x...",
     "rewardPerWin": "10",
     "maxRetries": 3,
     "backoffMs": 1000,
     "cachePath": ".cache/processed-events.jsonl",
    "cacheMaxEntries": 1000,
    "healthPath": ".cache/health.json",
     "healthHost": "0.0.0.0",
     "healthCorsOrigin": "*",
     "healthPort": 8787,
     "logFilePath": ".logs/worboo-relayer.log",
     "logMaxBytes": 5242880,
     "logBackupCount": 5,
    "logHttpEndpoint": "https://logs.example/ship"
   }
   ```
   > You can store the config file wherever you like. Set `RELAYER_CONFIG_PATH` if you keep it outside `packages/relayer/config/`. Use `RELAYER_LOG_HTTP_ENDPOINT` (or `logHttpEndpoint`) to forward structured JSON logs to your collector.

   Environment variables remain supported and always take precedence, so you can still drop quick overrides into a `.env` file if required (see `packages/relayer/.env.example`). Set `healthCorsOrigin` (or `RELAYER_HEALTH_CORS_ORIGIN`) to `"disable"` if you need to omit the header entirely.

2. Start the relayer:
   ```bash
   cd packages/relayer
   npm run start
   ```
3. Output example:
   ```
   [relayer] starting Worboo reward listener
    - registry: 0x...
    - token:    0x...
    - reward:   10000000000000000000 wei
    - operator: 0xRELAYER...
    - retries:  3 (backoff 1000ms)
   - cache:    <repo>/.cache/processed-events.jsonl
   ```

When a game win occurs (via `recordGame`), the relayer mints `rewardPerWin` WBOO to the victorious player.

> Processed events are persisted to `.cache/processed-events.jsonl` by default so relayer restarts will not double-mint. Configure `cacheMaxEntries` (or `RELAYER_CACHE_MAX_ENTRIES`) to cap retention; the oldest entries are trimmed automatically. Delete the file if you intentionally need to re-run historical events.

Check service health at any time:

```bash
npm run status
```

This prints a JSON snapshot (queue depth, last mint timestamp, processed cache size) using the persisted health file.

The same payload is available over HTTP at `http://localhost:8787/healthz` (adjust host/port via env). Point `REACT_APP_RELAYER_HEALTH_URL` to this endpoint so the navbar can show live queue depth or surface health errors. JSONL logs are written to `.logs/worboo-relayer.log` when `RELAYER_LOG_FILE` is set; rotate/ship them to your logging backend of choice. See [doc/observability.md](observability.md) for Grafana/Prometheus notes.

### 8.1 Run via Docker (optional)

```bash
docker build -f packages/relayer/Dockerfile -t worboo-relayer .
docker run --rm \
  -p 8787:8787 \
  -v $(pwd)/packages/relayer/config:/app/packages/relayer/config \
  -e RELAYER_CONFIG_PATH=/app/packages/relayer/config/relayer.config.json \
  worboo-relayer
```

> Mount a directory containing `relayer.config.json` (or pass `RELAYER_CONFIG_PATH`) and, if desired, mount `.cache/` to persist processed events across restarts.

### 8.2 Run via PM2 (optional)

```bash
npm install --global pm2
pm2 start packages/relayer/ecosystem.config.cjs
pm2 status
```

PM2 will keep the service alive and restart on crashes. Use `pm2 restart worboo-relayer` after updating binaries and `pm2 save` to persist across reboots.

---

## 9. Launch the Worboo Assistant Backend (Optional)

The assistant service powers hints consumed by the React app. It supports both static responses (great for demos without external dependencies) and proxy mode (forwarding to a real LLM endpoint).

1. Configure the service:
   ```bash
   cd packages/assistant
   cp config/assistant.config.json config/assistant.config.local.json  # optional copy for custom settings
   ```
   - `"mode": "static"` returns messages from `staticMessages`.
   - `"mode": "proxy"` forwards requests to `proxy.url`, applying `proxy.headers`, `bodyTemplate`, and `responsePath` to extract the hint string.
   - Keep secrets/API keys inside the JSON file; no environment variables are required, but you can point to an external file via `ASSISTANT_CONFIG_PATH`.
2. Start the backend:
   ```bash
   npm run dev
   ```
3. Point the frontend at the running service:
   ```ini
   # react-wordle/.env.local
   REACT_APP_ASSISTANT_ENABLED=true
   REACT_APP_ASSISTANT_URL=http://127.0.0.1:8788/hint
   ```
4. Run `npm test --workspace assistant-service` to confirm backend unit tests pass. The Vitest suite covers static mode, proxy mode, and fallback behaviour.
5. Manual ping (optional):
   ```bash
   npm run hint --workspace assistant-service -- --prompt "Preview tomorrow's Worboo word"
   ```
6. Health metrics: `curl http://127.0.0.1:8788/healthz` to confirm uptime, request counters, and fallback usage (CORS headers follow your config).

---

## 10. Frontend Verification

- Connect the same wallet in the UI.
- After registering and winning a puzzle, refresh the shop modal—balance should update once the relayer transaction confirms.
- The navbar now surfaces relayer status: pending wins trigger a banner, and successful mints show `Relayer minted +X WBOO` once the relayer processes the event.
- Open the profile sidebar to confirm the generated Polka ID, wallet summary, activity heatmap, and badge gallery render correctly.
- Complete a word and verify the stats modal: daily progress updates, share CTA copies to clipboard, “Review word details” opens the glossary modal, and “Play next Worboo word” advances without duplicate popups.
- For manual mint testing, call `mintTo` via Hardhat console:
  ```bash
  npx hardhat console --network moonbase
  > const token = await ethers.getContractAt("WorbooToken", "<tokenAddress>");
  > const role = await token.GAME_MASTER_ROLE();
  > await token.hasRole(role, "<yourRelayer>");
  ```

---

## 11. Test Commands Recap

| Layer | Command |
| --- | --- |
| Contracts | `npm run test` (inside `packages/contracts`) |
| Contracts – coverage | `REPORT_GAS=false npm run coverage` |
| Contracts – gas report | `REPORT_GAS=true npm run gas` |
| Contracts – coverage + gas evidence | `npm run report:evidence` (inside `packages/contracts`) |
| Relayer config | `npm run test` (inside `packages/relayer`) |
| Frontend targeted suite | `npm run test:targeted` (inside `react-wordle`) |
| Frontend JSON report | `npm run test:targeted:report` (inside `react-wordle`) |

---

## 12. Troubleshooting

| Issue | Fix |
| --- | --- |
| `Error HH8` (network config) | Verify `.env` values, ensure the RPC URL is reachable. |
| Missing balances | Confirm relayer is running, wallet has `GAME_MASTER_ROLE`, and transaction succeeded on Moonscan. |
| Frontend dev server fails to start | Ensure `npm run dev` is used (Vite). If another process is on port 3000, pass `--port 3100`. |
| Wallet connection fails | Ensure MetaMask is set to Moonbase Alpha (chainId 1287). |

---

All steps complete—Worboo is now live on Moonbase Alpha with automatic reward minting. Happy hacking! 🟩🟨⬛







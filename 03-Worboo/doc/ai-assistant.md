# Worboo AI Assistant Integration Guide

The `useWorbooAssistant` hook provides a bridge between the frontend and any hosted hint/LLM service. This document explains how to connect a backend, structure responses, and validate the integration before demos.

## 1. Configuration Overview

Primary configuration lives in `react-wordle/src/config/app-config.json` (edit this file directly to avoid environment-variable churn on Windows setups):

- `features.aiAssistant.enabled`: set to `true` to activate remote calls (defaults to `false` for deterministic demos).
- `baseUrl`: HTTPS endpoint that accepts JSON POST payloads.
- `model`: Passed through to your service if it supports multiple models.
- `promptFirstAttempt` / `promptRetry`: Templates with a `{word}` placeholder for the solution. The hook swaps these depending on how many hints have been requested in the current puzzle.
- `headers`: Optional key/value map (e.g., API keys) automatically merged into each request.

The TypeScript helper (`appConfig.ts`) merges the JSON values with any environment overrides. Environment variables (inside `react-wordle/.env.local`) remain available if you need per-session overrides:

| Env key | Description |
| --- | --- |
| `REACT_APP_ASSISTANT_ENABLED` | `"true"` / `"false"` to toggle the remote service |
| `REACT_APP_ASSISTANT_URL` | HTTPS endpoint for hint generation |
| `REACT_APP_ASSISTANT_MODEL` | Optional model identifier passed through in the request body |
| `REACT_APP_ASSISTANT_PROMPT_FIRST` | Prompt template for the first hint (supports `{word}`) |
| `REACT_APP_ASSISTANT_PROMPT_RETRY` | Prompt template for subsequent hints |
| `REACT_APP_ASSISTANT_HEADERS` | JSON object of extra headers (`{"Authorization":"Bearer ..."}`) merged with the JSON file |
| `REACT_APP_SHOP_DEMO_MODE` | (Bonus) mirror the `shopDemoMode` toggle without editing code |
| `REACT_APP_ZK_PROOFS_ENABLED` | Enables the Halo2 pipeline once backend support returns |

### Backend companion (`packages/assistant`)

- Default config: `packages/assistant/config/assistant.config.json`
- Override path: set `ASSISTANT_CONFIG_PATH=D:\...\assistant.config.json`
- Modes:
  - `"static"` – serves curated hints defined in `staticMessages`
  - `"proxy"` – forwards requests to a real LLM endpoint (`proxy.url`) and extracts hints via `responsePath`
- Run locally: `npm start --workspace assistant-service`
- CLI probe: `npm run hint --workspace assistant-service -- --prompt "Explain Moonbase"`
- Tests: `npm test --workspace assistant-service`
- Health metrics: GET `http://127.0.0.1:8788/healthz` returns JSON with uptime, request counters, and fallback usage (with CORS headers if enabled).

Example production JSON snippet:

```json
{
  "features": {
    "shopDemoMode": false,
    "zkProofsEnabled": false,
    "aiAssistant": {
      "enabled": true,
      "baseUrl": "https://assistant.example.com/v1/hint",
      "model": "moonbase-hint-001",
      "promptFirstAttempt": "Provide an encouraging hint for the hidden word \"{word}\" without revealing it. Keep it under 140 characters.",
      "promptRetry": "Learner needs a stronger hint. Give a more direct clue for the word \"{word}\", but avoid spelling it out.",
      "headers": {
        "Authorization": "Bearer moonbase-demo"
      }
    }
  }
}
```

## 2. Request & Response Contract

### Request payload
```json
{
  "model": "moonbase-hint-001",
  "prompt": "Provide an encouraging hint for the hidden word \"polkadot\"..."
}
```

Additional fields can be added by your backend; the hook only guarantees the presence of `model` and `prompt`.

### Expected response

The hook inspects the JSON body and accepts any of the fields below:

- `message`
- `output`
- `result`
- `choices[0].message.content`
- `choices[0].text`

If none of the above are present (or the request fails), the hook falls back to the curated `WORBOO_CHAT_MESSAGES` array.

Sample response:
```json
{
  "message": "Think of a parachain that links everything together across the dots."
}
```

## 3. Error Handling & Timeouts

- Failed requests are caught, logged to the console, and trigger the fallback hint. This keeps the UI responsive during demos if the assistant backend is unavailable.
- The hook does not implement retries; add them in the backend or proxy if needed.
- Use CDN/proxy caches to throttle repeated requests per player/day if you expect high traffic.

## 4. Local Testing Checklist

1. Set `"features.aiAssistant.enabled": true` in the JSON file and point `"baseUrl"` to the assistant backend (default `http://127.0.0.1:8788/hint`).
2. Run `npm test -- --run src/hooks/__tests__/useWorbooAssistant.test.tsx` to ensure the fallback path still passes.
3. Start the frontend and solve a word:
   - Observe spinner (`isThinking`) while the request is in flight.
   - Confirm the returned message replaces the default hint.
4. Test network failure by stopping the mock server; confirm fallback messages appear and no unhandled errors are thrown.

## 5. Deployment Notes

- Add authentication (e.g., API key header or JWT) before enabling in production; extend the hook to include headers if required.
- Consider rate limiting per wallet/Polka ID using the relayer or a lightweight backend cache.
- Log assistant responses to observability tooling (e.g., JSON logs or metrics) so you can spot repeated failures quickly.

With the hook and configuration in place, swapping in a real LLM service becomes a matter of updating `app-config.json` (or env overrides) and pushing the backend URL—no frontend code changes required.

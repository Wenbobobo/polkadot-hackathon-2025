export type WorbooAppConfig = {
  network: {
    requiredChainId: number
    name: string
  }
  features: {
    /** Enables local demo flows when contracts are unavailable. */
    shopDemoMode: boolean
    /** Toggle once halo proving pipeline is production ready. */
    zkProofsEnabled: boolean
    aiAssistant: {
      enabled: boolean
      baseUrl: string
      model: string
      promptFirstAttempt: string
      promptRetry: string
      headers: Record<string, string>
    }
  }
}

import fileConfigJson from './app-config.json'

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

const env = process.env

type PartialConfig = Partial<WorbooAppConfig>
type PartialAssistantConfig = Partial<
  WorbooAppConfig['features']['aiAssistant']
>

const fileConfig = (fileConfigJson ?? {}) as PartialConfig

const parseHeaders = (value: string | undefined) => {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed).reduce<Record<string, string>>(
        (acc, [key, val]) => {
          if (typeof val === 'string') {
            acc[key] = val
          } else if (val != null) {
            acc[key] = String(val)
          }
          return acc
        },
        {}
      )
    }
  } catch (error) {
    console.warn('[appConfig] Failed to parse REACT_APP_ASSISTANT_HEADERS', error)
  }
  return {}
}

const mergeHeaders = (
  base: Record<string, string>,
  overrides: Record<string, string>
) => ({
  ...base,
  ...overrides,
})

const resolveBooleanWithFile = (
  envValue: string | undefined,
  fileValue: boolean | undefined,
  fallback: boolean
) =>
  parseBoolean(
    envValue,
    fileValue !== undefined ? fileValue : fallback
  )

const resolveString = (
  envValue: string | undefined,
  fileValue: string | undefined,
  fallback: string
) => {
  if (envValue !== undefined) return envValue
  if (fileValue !== undefined) return fileValue
  return fallback
}

const fileAssistant: PartialAssistantConfig =
  fileConfig.features?.aiAssistant ?? {}

const DEFAULT_PROMPT_FIRST =
  fileAssistant.promptFirstAttempt ??
  'You are Worboo, a playful teacher helping learners guess the word "{word}". Offer a gentle hint without revealing the answer.'
const DEFAULT_PROMPT_RETRY =
  fileAssistant.promptRetry ??
  'You are Worboo, an encouraging assistant. The correct word is "{word}". Give a firmer hint but keep the experience fun.'

// NOTE: Update this file to customise hackathon builds.
export const appConfig: WorbooAppConfig = {
  network: {
    requiredChainId: Number(
      env.REACT_APP_NETWORK_CHAIN_ID ??
        fileConfig.network?.requiredChainId ??
        1287
    ),
    name: resolveString(
      env.REACT_APP_NETWORK_NAME,
      fileConfig.network?.name,
      'Moonbase Alpha'
    ),
  },
  features: {
    // Keep true for hackathon demos where the shop should function without on-chain state.
    shopDemoMode: resolveBooleanWithFile(
      env.REACT_APP_SHOP_DEMO_MODE,
      fileConfig.features?.shopDemoMode,
      true
    ),
    zkProofsEnabled: resolveBooleanWithFile(
      env.REACT_APP_ZK_PROOFS_ENABLED,
      fileConfig.features?.zkProofsEnabled,
      false
    ),
    aiAssistant: {
      enabled: resolveBooleanWithFile(
        env.REACT_APP_ASSISTANT_ENABLED,
        fileAssistant.enabled,
        false
      ),
      baseUrl: resolveString(
        env.REACT_APP_ASSISTANT_URL,
        fileAssistant.baseUrl,
        ''
      ),
      model: resolveString(
        env.REACT_APP_ASSISTANT_MODEL,
        fileAssistant.model,
        ''
      ),
      promptFirstAttempt: resolveString(
        env.REACT_APP_ASSISTANT_PROMPT_FIRST,
        fileAssistant.promptFirstAttempt,
        DEFAULT_PROMPT_FIRST
      ),
      promptRetry: resolveString(
        env.REACT_APP_ASSISTANT_PROMPT_RETRY,
        fileAssistant.promptRetry,
        DEFAULT_PROMPT_RETRY
      ),
      headers: mergeHeaders(
        fileAssistant.headers ?? {},
        parseHeaders(env.REACT_APP_ASSISTANT_HEADERS)
      ),
    },
  },
}

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

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

const env = process.env

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

// NOTE: Update this file to customise hackathon builds.
export const appConfig: WorbooAppConfig = {
  network: {
    requiredChainId: Number(env.REACT_APP_NETWORK_CHAIN_ID ?? 1287),
    name: env.REACT_APP_NETWORK_NAME ?? 'Moonbase Alpha',
  },
  features: {
    // Keep true for hackathon demos where the shop should function without on-chain state.
    shopDemoMode: parseBoolean(env.REACT_APP_SHOP_DEMO_MODE, true),
    zkProofsEnabled: parseBoolean(env.REACT_APP_ZK_PROOFS_ENABLED, false),
    aiAssistant: {
      enabled: parseBoolean(env.REACT_APP_ASSISTANT_ENABLED, false),
      baseUrl: env.REACT_APP_ASSISTANT_URL ?? '',
      model: env.REACT_APP_ASSISTANT_MODEL ?? '',
      promptFirstAttempt:
        env.REACT_APP_ASSISTANT_PROMPT_FIRST ??
        'You are Worboo, a playful teacher helping learners guess the word "{word}". Offer a gentle hint without revealing the answer.',
      promptRetry:
        env.REACT_APP_ASSISTANT_PROMPT_RETRY ??
        'You are Worboo, an encouraging assistant. The correct word is "{word}". Give a firmer hint but keep the experience fun.',
      headers: parseHeaders(env.REACT_APP_ASSISTANT_HEADERS),
    },
  },
}

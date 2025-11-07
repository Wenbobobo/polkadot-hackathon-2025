import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WorbooAppConfig } from '../appConfig'

const ORIGINAL_ENV = { ...process.env }

const resetEnv = () => {
  process.env = { ...ORIGINAL_ENV }
}

const mockConfigFile = (overrides: Partial<WorbooAppConfig>) => {
  vi.doMock('../app-config.json', () => ({ default: overrides }))
}

describe('appConfig', () => {
  beforeEach(() => {
    vi.resetModules()
    resetEnv()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    resetEnv()
  })

  it('derives defaults from the JSON config file when no env overrides are present', async () => {
    mockConfigFile({
      network: { requiredChainId: 4242, name: 'Testchain' },
      features: {
        shopDemoMode: false,
        zkProofsEnabled: true,
        aiAssistant: {
          enabled: true,
          baseUrl: 'https://assistant.local/hint',
          model: 'gpt-test',
          promptFirstAttempt: 'First prompt for "{word}"',
          promptRetry: 'Retry prompt for "{word}"',
          headers: {
            Authorization: 'Bearer file-token',
          },
        },
      },
    })

    const { appConfig } = (await import('../appConfig')) as {
      appConfig: WorbooAppConfig
    }

    expect(appConfig.network.requiredChainId).toBe(4242)
    expect(appConfig.network.name).toBe('Testchain')
    expect(appConfig.features.shopDemoMode).toBe(false)
    expect(appConfig.features.zkProofsEnabled).toBe(true)
    expect(appConfig.features.aiAssistant.enabled).toBe(true)
    expect(appConfig.features.aiAssistant.baseUrl).toBe(
      'https://assistant.local/hint'
    )
    expect(appConfig.features.aiAssistant.model).toBe('gpt-test')
    expect(appConfig.features.aiAssistant.promptFirstAttempt).toBe(
      'First prompt for "{word}"'
    )
    expect(appConfig.features.aiAssistant.headers.Authorization).toBe(
      'Bearer file-token'
    )
  })

  it('allows environment variables to override JSON config values', async () => {
    mockConfigFile({
      network: { requiredChainId: 987, name: 'Moonbase JSON' },
      features: {
        shopDemoMode: true,
        zkProofsEnabled: false,
        aiAssistant: {
          enabled: false,
          baseUrl: '',
          model: '',
          promptFirstAttempt: 'JSON first "{word}"',
          promptRetry: 'JSON retry "{word}"',
          headers: {},
        },
      },
    })

    process.env.REACT_APP_NETWORK_CHAIN_ID = '1287'
    process.env.REACT_APP_NETWORK_NAME = 'Moonbase Alpha'
    process.env.REACT_APP_ASSISTANT_ENABLED = 'true'
    process.env.REACT_APP_ASSISTANT_URL = 'https://override.test'
    process.env.REACT_APP_ASSISTANT_MODEL = 'gpt-override'
    process.env.REACT_APP_ASSISTANT_PROMPT_FIRST = 'Env first "{word}"'
    process.env.REACT_APP_ASSISTANT_HEADERS = JSON.stringify({
      'X-API-Key': 'override-key',
    })

    const { appConfig } = (await import('../appConfig')) as {
      appConfig: WorbooAppConfig
    }

    expect(appConfig.network.requiredChainId).toBe(1287)
    expect(appConfig.network.name).toBe('Moonbase Alpha')
    expect(appConfig.features.aiAssistant.enabled).toBe(true)
    expect(appConfig.features.aiAssistant.baseUrl).toBe(
      'https://override.test'
    )
    expect(appConfig.features.aiAssistant.model).toBe('gpt-override')
    expect(appConfig.features.aiAssistant.promptFirstAttempt).toBe(
      'Env first "{word}"'
    )
    expect(appConfig.features.aiAssistant.headers['X-API-Key']).toBe(
      'override-key'
    )
  })
})

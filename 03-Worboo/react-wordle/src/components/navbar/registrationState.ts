import type { WorbooProfile } from '../../hooks/useWorbooPlayer'
import { appConfig } from '../../config/appConfig'

type ResolveRegistrationPromptParams = {
  isConnected: boolean
  isReady: boolean
  profile?: WorbooProfile
  chainId?: number
  registrationError?: string | null
}

export type RegistrationPrompt = {
  visible: boolean
  message: string
  canRegister: boolean
  variant: 'info' | 'warning' | 'error'
}

const basePrompt: RegistrationPrompt = {
  visible: false,
  message: '',
  canRegister: false,
  variant: 'info',
}

const formatRegistrationError = (error?: string | null) => {
  if (!error) {
    return ''
  }

  const normalized = error.toLowerCase()
  if (normalized.includes('insufficient funds')) {
    return 'You need a little DEV to cover gas before registering.'
  }
  if (normalized.includes('already registered')) {
    return 'Your wallet is already registered. Refresh to continue playing.'
  }
  if (normalized.includes('call_exception')) {
    return 'Moonbase rejected the transaction. Double-check the Worboo registry address and try again.'
  }
  return 'Please confirm the transaction in your wallet and try again.'
}

export const resolveRegistrationPrompt = ({
  isConnected,
  isReady,
  profile,
  chainId,
  registrationError,
}: ResolveRegistrationPromptParams): RegistrationPrompt => {
  if (!isConnected) {
    return basePrompt
  }

  const requiredChainId = appConfig.network.requiredChainId
  const networkName = appConfig.network.name

  if (chainId !== undefined && chainId !== requiredChainId) {
    return {
      visible: true,
      message: `Switch to ${networkName} (${requiredChainId}) to register and earn rewards.`,
      canRegister: false,
      variant: 'error',
    }
  }

  if (!isReady) {
    return {
      visible: true,
      message:
        'Worboo contracts are offline. Set contract addresses in the config before registering.',
      canRegister: false,
      variant: 'warning',
    }
  }

  if (registrationError) {
    return {
      visible: true,
      message: `Registration failed. ${formatRegistrationError(registrationError)}`,
      canRegister: true,
      variant: 'error',
    }
  }

  if (!profile?.isRegistered) {
    return {
      visible: true,
      message: `Register on-chain to start earning WBOO rewards on ${networkName}.`,
      canRegister: true,
      variant: 'info',
    }
  }

  return basePrompt
}

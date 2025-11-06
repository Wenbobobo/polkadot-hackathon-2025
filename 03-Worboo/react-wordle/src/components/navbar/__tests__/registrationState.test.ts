import { resolveRegistrationPrompt } from '../registrationState'

const baseParams = {
  isConnected: true,
  isReady: true,
  profile: { isRegistered: false } as any,
  chainId: 1287,
  registrationError: null as string | null,
}

describe('resolveRegistrationPrompt', () => {
  it('hides the banner when wallet is not connected', () => {
    const result = resolveRegistrationPrompt({
      ...baseParams,
      isConnected: false,
    })
    expect(result.visible).toBe(false)
  })

  it('disables CTA and shows network guidance when on the wrong chain', () => {
    const result = resolveRegistrationPrompt({
      ...baseParams,
      chainId: 1,
    })

    expect(result.visible).toBe(true)
    expect(result.variant).toBe('error')
    expect(result.canRegister).toBe(false)
    expect(result.message).toMatch(/Moonbase Alpha/i)
  })

  it('shows setup warning when contracts are unavailable', () => {
    const result = resolveRegistrationPrompt({
      ...baseParams,
      isReady: false,
    })

    expect(result.visible).toBe(true)
    expect(result.variant).toBe('warning')
    expect(result.canRegister).toBe(false)
    expect(result.message).toMatch(/Set contract addresses/i)
  })

  it('enables CTA when registration is needed', () => {
    const result = resolveRegistrationPrompt(baseParams)

    expect(result.visible).toBe(true)
    expect(result.variant).toBe('info')
    expect(result.canRegister).toBe(true)
    expect(result.message).toMatch(/start earning/i)
  })

  it('persists banner with friendly message after a registration error', () => {
    const result = resolveRegistrationPrompt({
      ...baseParams,
      registrationError: 'CALL_EXCEPTION',
    })

    expect(result.visible).toBe(true)
    expect(result.variant).toBe('error')
    expect(result.canRegister).toBe(true)
    expect(result.message).toMatch(/Registration failed/i)
  })
})

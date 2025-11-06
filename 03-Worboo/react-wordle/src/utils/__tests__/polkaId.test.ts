import { derivePolkaId, formatAddress } from '../polkaId'

describe('derivePolkaId', () => {
  it('derives from wallet address', () => {
    const id = derivePolkaId('0x1234567890abcdef')
    expect(id.startsWith('PL-')).toBe(true)
    expect(id.length).toBe(9)
  })

  it('preserves explicit polka id', () => {
    expect(derivePolkaId('pl-123456')).toBe('PL-123456')
  })

  it('formats numeric ids', () => {
    expect(derivePolkaId('042108')).toBe('PL-042108')
  })

  it('falls back to zeros on invalid input', () => {
    expect(derivePolkaId('not-valid')).toBe('PL-000000')
  })
})

describe('formatAddress', () => {
  it('shortens known address', () => {
    expect(formatAddress('0x1234567890abcdef')).toBe('0x1234...cdef')
  })

  it('returns prompt when address missing', () => {
    expect(formatAddress()).toBe('Connect wallet to sync')
  })
})

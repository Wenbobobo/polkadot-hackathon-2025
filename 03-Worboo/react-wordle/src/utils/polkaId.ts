const POLKA_PREFIX = 'PL-'
const POLKA_DIGITS = 6

const normaliseSource = (input?: string) => input?.trim() ?? ''

export const derivePolkaId = (input?: string): string => {
  const source = normaliseSource(input)
  if (!source) {
    return `${POLKA_PREFIX}${'0'.repeat(POLKA_DIGITS)}`
  }

  if (/^PL-\d{6}$/i.test(source)) {
    return source.toUpperCase()
  }

  if (/^\d{6}$/.test(source)) {
    return `${POLKA_PREFIX}${source}`
  }

  const hex = source.startsWith('0x') ? source.slice(2) : source
  if (!/^[a-fA-F0-9]+$/.test(hex)) {
    return `${POLKA_PREFIX}${'0'.repeat(POLKA_DIGITS)}`
  }

  const numeric = parseInt(hex.slice(0, 8), 16)
  const suffix = (numeric % 1_000_000).toString().padStart(POLKA_DIGITS, '0')
  return `${POLKA_PREFIX}${suffix}`
}

export const formatAddress = (address?: string): string => {
  if (!address) return 'Connect wallet to sync'
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const copyToClipboard = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

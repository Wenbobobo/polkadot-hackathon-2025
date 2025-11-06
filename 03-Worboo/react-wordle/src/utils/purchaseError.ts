const NORMALISED_INSUFFICIENT_FUNDS = /insufficient funds/i
const NORMALISED_REVERT = /call_exception/i

export const describePurchaseError = (error: unknown): string => {
  const message =
    (typeof error === 'object' && error && 'message' in error
      ? String((error as any).message)
      : typeof error === 'string'
      ? error
      : '') || ''

  if (NORMALISED_INSUFFICIENT_FUNDS.test(message)) {
    return 'Not enough WBOO to complete this purchase. Earn more rewards or top-up first.'
  }

  if (NORMALISED_REVERT.test(message)) {
    return 'Worboo Shop rejected the transaction. Confirm you are registered and hold enough balance.'
  }

  return 'Purchase failed. Please confirm the transaction in your wallet and try again.'
}

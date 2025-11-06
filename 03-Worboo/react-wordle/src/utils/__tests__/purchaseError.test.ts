import { describePurchaseError } from '../purchaseError'

describe('describePurchaseError', () => {
  it('handles insufficient funds errors', () => {
    const message = describePurchaseError(
      new Error('insufficient funds for intrinsic transaction cost')
    )
    expect(message).toMatch(/Not enough WBOO/i)
  })

  it('handles contract reverts', () => {
    const message = describePurchaseError(
      new Error('CALL_EXCEPTION: execution reverted')
    )
    expect(message).toMatch(/Worboo Shop rejected/i)
  })

  it('falls back to generic messaging', () => {
    const message = describePurchaseError(new Error('unexpected failure'))
    expect(message).toMatch(/Please confirm the transaction/i)
  })
})

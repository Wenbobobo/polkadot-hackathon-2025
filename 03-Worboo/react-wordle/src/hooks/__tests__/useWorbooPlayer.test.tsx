import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Contract } from 'ethers'

const {
  useQueryMock,
  useMutationMock,
  useQueryClientMock,
  invalidateQueries,
} = vi.hoisted(() => {
  const invalidateQueriesFn = vi.fn()
  return {
    useQueryMock: vi.fn(),
    useMutationMock: vi.fn(),
    useQueryClientMock: vi.fn(() => ({ invalidateQueries: invalidateQueriesFn })),
    invalidateQueries: invalidateQueriesFn,
  }
})

const profileRefetch = vi.fn()
const balanceRefetch = vi.fn()
const inventoryRefetch = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useQuery: useQueryMock,
  useMutation: useMutationMock,
  useQueryClient: useQueryClientMock,
}))

let contractsMock: any

const { getShopItemTokenIdMock } = vi.hoisted(() => ({
  getShopItemTokenIdMock: vi.fn(() => 42),
}))

vi.mock('../../services/contracts', () => ({
  useWorbooContracts: () => contractsMock,
}))

vi.mock('../../utils/shop', () => ({
  getOnChainShopItems: vi.fn(() => []),
  getShopItemTokenId: getShopItemTokenIdMock,
}))

import { useWorbooPlayer } from '../useWorbooPlayer'

const purchaseWaitMock = vi.fn(async () => undefined)
const registerWaitMock = vi.fn(async () => undefined)
const purchaseMock = vi.fn(async () => ({ wait: purchaseWaitMock }))
const registerMock = vi.fn(async () => ({ wait: registerWaitMock }))

beforeEach(() => {
  invalidateQueries.mockClear()
  profileRefetch.mockReset()
  balanceRefetch.mockReset()
  inventoryRefetch.mockReset()
  purchaseWaitMock.mockClear()
  registerWaitMock.mockClear()
  purchaseMock.mockClear()
  registerMock.mockClear()
  getShopItemTokenIdMock.mockClear()

  useQueryMock.mockImplementation((queryKey: unknown[]) => {
    const key = JSON.stringify(queryKey)
    if (key.includes('"profile"')) {
      return {
        data: {
          isRegistered: true,
          totalGames: 3,
          totalWins: 2,
          currentStreak: 1,
          lastDayId: 55,
          lastSubmissionAt: 999,
        },
        refetch: profileRefetch,
      }
    }
    if (key.includes('"decimals"')) {
      return { data: 18, refetch: vi.fn() }
    }
    if (key.includes('"symbol"')) {
      return { data: 'WBOO', refetch: vi.fn() }
    }
    if (key.includes('"balance"')) {
      return { data: BigInt(1000), refetch: balanceRefetch }
    }
    if (key.includes('"inventory"')) {
      return { data: { 'item-1': BigInt(1) }, refetch: inventoryRefetch }
    }
    return { data: undefined, refetch: vi.fn() }
  })

  useMutationMock.mockImplementation(
    (
      mutateFn: (...args: any[]) => Promise<unknown>,
      options?: { onSuccess?: (...args: any[]) => void }
    ) => ({
      mutateAsync: vi.fn(async (...args: any[]) => {
        const result = await mutateFn(...args)
        options?.onSuccess?.(result, ...args)
        return result
      }),
      isLoading: false,
    })
  )

  contractsMock = {
    registry: {} as Contract,
    registryWrite: { register: registerMock } as Contract,
    token: {} as Contract,
    tokenWrite: {} as Contract,
    shop: {} as Contract,
    shopWrite: { purchase: purchaseMock } as Contract,
    isReady: true,
  }
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('useWorbooPlayer', () => {
  it('invalidates balance and inventory after successful purchase', async () => {
    const { result } = renderHook(() => useWorbooPlayer('0xPlayer'))

    await act(async () => {
      await result.current.purchase({ itemId: 'boost', quantity: 2 })
    })

    expect(getShopItemTokenIdMock).toHaveBeenCalledWith('boost')
    expect(purchaseMock).toHaveBeenCalledWith(42, 2)
    expect(purchaseWaitMock).toHaveBeenCalled()
    expect(invalidateQueries).toHaveBeenCalledWith([
      'worboo',
      'token',
      'balance',
      '0xPlayer',
    ])
    expect(invalidateQueries).toHaveBeenCalledWith([
      'worboo',
      'shop',
      'inventory',
      '0xPlayer',
    ])
  })

  it('rejects registration when wallet contracts are unavailable', async () => {
    contractsMock.registryWrite = null

    const { result } = renderHook(() => useWorbooPlayer('0xPlayer'))

    await expect(result.current.register()).rejects.toThrow('Wallet not connected')
    expect(registerMock).not.toHaveBeenCalled()
    expect(profileRefetch).not.toHaveBeenCalled()
  })
})

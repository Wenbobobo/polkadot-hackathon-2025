import { EventEmitter } from 'events'
import { act, render } from '@testing-library/react'
import React, { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Contract } from 'ethers'

vi.mock('ethers', () => ({
  constants: {
    AddressZero: '0x0000000000000000000000000000000000000000',
  },
  utils: {
    formatUnits: () => '10',
  },
}))

vi.mock('../../services/contracts', () => ({
  useWorbooContracts: vi.fn(() => ({
    registry: null,
    registryWrite: null,
    token: null,
    tokenWrite: null,
    shop: null,
    shopWrite: null,
    isReady: false,
  })),
}))

vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0xPlayer',
    isConnected: true,
  }),
}))

import { useRelayerNotifications } from '../useRelayerNotifications'
import { useWorbooContracts } from '../../services/contracts'

const ZeroAddress = '0x0000000000000000000000000000000000000000'
const mockedUseWorbooContracts = vi.mocked(useWorbooContracts)

class MockContract extends EventEmitter {
  on(event: string, listener: (...args: any[]) => void): this {
    super.on(event, listener)
    return this
  }

  off(event: string, listener: (...args: any[]) => void): this {
    super.off(event, listener)
    return this
  }
}

describe('useRelayerNotifications', () => {
const registry = new MockContract() as unknown as Contract
const token = new MockContract() as unknown as Contract
  const refreshMock = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    registry.removeAllListeners()
    token.removeAllListeners()
    refreshMock.mockReset()

    mockedUseWorbooContracts.mockReturnValue({
      registry,
      registryWrite: null,
      token,
      tokenWrite: null,
      shop: null,
      shopWrite: null,
      isReady: true,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  const renderHook = () => {
    const values: any[] = []

    const TestComponent = () => {
      const value = useRelayerNotifications({
        tokenSymbol: 'WBOO',
        onRewardAcknowledged: refreshMock,
      })
      useEffect(() => {
        values.push(value)
      }, [value])
      return null
    }

    render(<TestComponent />)
    return values
  }

  it('emits a success notification when a mint is observed', async () => {
    const values = renderHook()

    act(() => {
      registry.emit(
        'GameRecorded',
        '0xPlayer',
        1n,
        '0xhash',
        3,
        true,
        1n,
        10n,
        5n,
        { transactionHash: '0xgame', logIndex: 0 }
      )
    })

    act(() => {
      token.emit(
        'Transfer',
        ZeroAddress,
        '0xplayer',
        BigInt('10000000000000000000'),
        { transactionHash: '0xmint' }
      )
    })

    const latest = values.at(-1)
    expect(latest.notification?.kind).toBe('success')
    expect(latest.notification?.amount).toBe('10')
    expect(latest.notification?.tokenSymbol).toBe('WBOO')
    expect(latest.pendingRewards).toBe(0)
  })

  it('emits a warning if a mint does not arrive soon enough', async () => {
    const values = renderHook()

    act(() => {
      registry.emit(
        'GameRecorded',
        '0xPlayer',
        1n,
        '0xhash',
        3,
        true,
        1n,
        10n,
        5n,
        { transactionHash: '0xgame', logIndex: 0 }
      )
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(45_000)
    })

    const latest = values.at(-1)
    expect(latest.notification?.kind).toBe('warning')
    expect(latest.notification?.message).toMatch(/pending/)
    expect(latest.pendingRewards).toBeGreaterThan(0)
  })
})

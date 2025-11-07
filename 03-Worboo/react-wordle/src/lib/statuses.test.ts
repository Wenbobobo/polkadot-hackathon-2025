import { beforeEach, describe, expect, test, vi } from 'vitest'
import { getGuessStatuses } from './statuses'

const mockSolutionGetter = vi.fn()

vi.mock('./words', async () => {
  const actual = await vi.importActual<typeof import('./words')>('./words')
  return {
    ...actual,
    get solution() {
      return mockSolutionGetter()
    },
  }
})

beforeEach(() => {
  mockSolutionGetter.mockReset()
})

describe('getGuessStatuses', () => {
  test('guess statuses', () => {
    expect(getGuessStatuses('ABCDE', 'EDCBA')).toEqual([
      'present',
      'present',
      'correct',
      'present',
      'present',
    ])
    expect(getGuessStatuses('ABCDE', 'VWXYZ')).toEqual([
      'absent',
      'absent',
      'absent',
      'absent',
      'absent',
    ])
    expect(getGuessStatuses('ABCDE', 'ABCDE')).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ])

    // https://github.com/cwackerfuss/react-wordle/issues/456
    expect(getGuessStatuses('BOSSY', 'SASSY')).toEqual([
      'absent',
      'absent',
      'correct',
      'correct',
      'correct',
    ])
  })
})

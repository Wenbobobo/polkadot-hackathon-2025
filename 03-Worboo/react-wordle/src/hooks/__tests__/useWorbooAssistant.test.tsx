import { useEffect } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { WORBOO_CHAT_MESSAGES } from '../../constants/strings'

type AssistantHook = (word: string) => {
  message: string
  requestHint: (options?: { delayMs?: number }) => Promise<void>
  reset: () => void
}

const createHarness = (hook: AssistantHook) => {
  const HarnessComponent = () => {
    const { message, requestHint, reset } = hook('polkadot')

    useEffect(() => {
      void requestHint()
    }, [requestHint])

    return (
      <div>
        <span data-testid="assistant-message">{message}</span>
        <button onClick={() => void requestHint()}>Hint</button>
        <button onClick={reset}>Reset</button>
      </div>
    )
  }

  return HarnessComponent
}

const loadHook = async () => {
  const module = await import('../useWorbooAssistant')
  return module.useWorbooAssistant
}

const resetAssistantEnv = () => {
  delete process.env.REACT_APP_ASSISTANT_ENABLED
  delete process.env.REACT_APP_ASSISTANT_URL
  delete process.env.REACT_APP_ASSISTANT_MODEL
  delete process.env.REACT_APP_ASSISTANT_HEADERS
  delete process.env.REACT_APP_ASSISTANT_PROMPT_FIRST
  delete process.env.REACT_APP_ASSISTANT_PROMPT_RETRY
}

describe('useWorbooAssistant', () => {
  beforeEach(() => {
    vi.resetModules()
    resetAssistantEnv()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
    resetAssistantEnv()
    delete (global as any).fetch
  })

  it('falls back to canned messages when assistant is disabled', async () => {
    const useWorbooAssistant = await loadHook()
    const Harness = createHarness(useWorbooAssistant)
    render(<Harness />)

    await waitFor(() =>
      expect(screen.getByTestId('assistant-message').textContent).toBe(
        WORBOO_CHAT_MESSAGES[1]
      )
    )

    fireEvent.click(screen.getByText('Hint'))

    await waitFor(() =>
      expect(screen.getByTestId('assistant-message').textContent).toBe(
        WORBOO_CHAT_MESSAGES[2]
      )
    )

    fireEvent.click(screen.getByText('Reset'))

    expect(screen.getByTestId('assistant-message').textContent).toBe(
      WORBOO_CHAT_MESSAGES[0]
    )
  })

  it('uses remote assistant when enabled', async () => {
    process.env.REACT_APP_ASSISTANT_ENABLED = 'true'
    process.env.REACT_APP_ASSISTANT_URL = 'https://assistant.test/hint'
    process.env.REACT_APP_ASSISTANT_MODEL = 'moonbase-hint'
    process.env.REACT_APP_ASSISTANT_HEADERS = JSON.stringify({
      Authorization: 'Bearer secret',
      'X-Custom': 'polyglot',
    })

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Remote hint for the hidden word.' }),
    })
    ;(global as any).fetch = fetchMock

    const useWorbooAssistant = await loadHook()
    const Harness = createHarness(useWorbooAssistant)
    render(<Harness />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://assistant.test/hint')
    expect(options).toMatchObject({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer secret',
        'X-Custom': 'polyglot',
      },
    })

    const body = JSON.parse(options.body as string)
    expect(body).toMatchObject({
      model: 'moonbase-hint',
      prompt: expect.stringContaining('polkadot'),
    })

    await waitFor(() =>
      expect(screen.getByTestId('assistant-message').textContent).toBe(
        'Remote hint for the hidden word.'
      )
    )
  })
})

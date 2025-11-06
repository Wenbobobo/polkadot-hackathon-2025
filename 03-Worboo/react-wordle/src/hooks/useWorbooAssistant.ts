import { useCallback, useEffect, useRef, useState } from 'react'

import { WORBOO_CHAT_MESSAGES } from '../constants/strings'
import { appConfig } from '../config/appConfig'

type RequestOptions = {
  delayMs?: number
}

const getFallbackMessage = (attempt: number) =>
  WORBOO_CHAT_MESSAGES[attempt % WORBOO_CHAT_MESSAGES.length] ?? WORBOO_CHAT_MESSAGES[0]

export const useWorbooAssistant = (solutionWord: string) => {
  const {
    enabled,
    baseUrl,
    model,
    promptFirstAttempt,
    promptRetry,
    headers,
  } = appConfig.features.aiAssistant

  const attemptRef = useRef(0)
  const [message, setMessage] = useState(WORBOO_CHAT_MESSAGES[0])
  const [isThinking, setIsThinking] = useState(false)

  const reset = useCallback(() => {
    attemptRef.current = 0
    setMessage(WORBOO_CHAT_MESSAGES[0])
    setIsThinking(false)
  }, [])

  useEffect(() => {
    reset()
  }, [solutionWord, reset])

  const requestHint = useCallback(
    async (options: RequestOptions = {}) => {
      const attemptIndex = attemptRef.current + 1
      attemptRef.current = attemptIndex

      if (options.delayMs && options.delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, options.delayMs))
      }

      if (!enabled || !baseUrl) {
        setMessage(getFallbackMessage(attemptIndex))
        return
      }

      setIsThinking(true)
      const promptTemplate =
        attemptIndex > 1 ? promptRetry : promptFirstAttempt
      const prompt = promptTemplate.replace('{word}', solutionWord)

      try {
        const payload: Record<string, unknown> = { prompt }
        if (model) {
          payload.model = model
        }

        const requestHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...headers,
        }

        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(`Assistant request failed with ${response.status}`)
        }

        const data = await response.json()
        const candidate =
          data.message ??
          data.output ??
          data.result ??
          (Array.isArray(data.choices)
            ? data.choices[0]?.message?.content ??
              data.choices[0]?.text ??
              null
            : null)

        if (typeof candidate === 'string' && candidate.trim().length > 0) {
          setMessage(candidate.trim())
        } else {
          setMessage(getFallbackMessage(attemptIndex))
        }
      } catch (error) {
        console.error('[worboo-assistant] hint failed', error)
        setMessage(getFallbackMessage(attemptIndex))
      } finally {
        setIsThinking(false)
      }
    },
    [
      baseUrl,
      enabled,
      headers,
      model,
      promptFirstAttempt,
      promptRetry,
      solutionWord,
    ]
  )

  return {
    message,
    isThinking,
    requestHint,
    reset,
  }
}

import React, { useMemo, useState } from 'react'
import { ShareIcon, BookOpenIcon, ArrowRightIcon } from '@heroicons/react/outline'
import { StatBar } from '../stats/StatBar'
import { Histogram } from '../stats/Histogram'
import { GameStats } from '../../lib/localStorage'
import { getNextGameDate, getToday } from '../../lib/words'
import { BaseModal } from './BaseModal'
import {
  STATISTICS_TITLE,
  GUESS_DISTRIBUTION_TEXT,
  NEW_WORD_TEXT,
  SHARE_TEXT,
} from '../../constants/strings'
import { MigrationIntro } from '../stats/MigrationIntro'
import { ENABLE_MIGRATE_STATS } from '../../constants/settings'
import { appConfig } from '../../config/appConfig'

type Props = {
  isOpen: boolean
  handleClose: () => void
  gameStats: GameStats
  isGameLost: boolean
  isGameWon: boolean
  handleShareToClipboard: () => void
  handleMigrateStatsButton: () => void
  numberOfGuessesMade: number
  onShowWordDetails?: () => void
  onNextWord?: () => void
  dailyProgress?: {
    completed: number
    total: number
    currentIndex: number
  }
}

export const StatsModal = ({
  isOpen,
  handleClose,
  gameStats,
  isGameLost,
  isGameWon,
  handleShareToClipboard,
  handleMigrateStatsButton,
  numberOfGuessesMade,
  onShowWordDetails,
  onNextWord,
  dailyProgress,
}: Props) => {
  const { features } = appConfig
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
  const nextUnlockLabel = useMemo(
    () => getNextGameDate(getToday()).toLocaleString(),
    []
  )

  const handleShare = () => {
    handleShareToClipboard()
    setShareFeedback('Copied results to clipboard!')
    setTimeout(() => setShareFeedback(null), 2500)
  }

  if (gameStats.totalGames <= 0) {
    return (
      <BaseModal
        title={STATISTICS_TITLE}
        isOpen={isOpen}
        handleClose={handleClose}
      >
        <StatBar gameStats={gameStats} />
        {ENABLE_MIGRATE_STATS && (
          <MigrationIntro handleMigrateStatsButton={handleMigrateStatsButton} />
        )}
      </BaseModal>
    )
  }
  return (
    <BaseModal
      title={STATISTICS_TITLE}
      isOpen={isOpen}
      handleClose={handleClose}
    >
      <StatBar gameStats={gameStats} />
      <h4 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
        {GUESS_DISTRIBUTION_TEXT}
      </h4>
      <Histogram
        gameStats={gameStats}
        isGameWon={isGameWon}
        numberOfGuessesMade={numberOfGuessesMade}
      />

      {dailyProgress && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
          <div className="font-semibold uppercase tracking-wide text-xs text-gray-500 dark:text-gray-400">
            Daily Progress
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {dailyProgress.completed}/{dailyProgress.total}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Current index: {dailyProgress.currentIndex + 1}
            </span>
          </div>
        </div>
      )}

      {(isGameLost || isGameWon) && (
        <>
          <div className="mt-5 space-y-3 sm:mt-6 dark:text-white">
            {features.zkProofsEnabled ? (
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={handleShare}
              >
                <ShareIcon className="mr-2 h-5 w-5" />
                {SHARE_TEXT}
              </button>
            ) : (
              <div className="rounded-lg border border-dashed border-purple-400 bg-purple-50/60 px-3 py-3 text-sm text-purple-800 dark:border-purple-700 dark:bg-purple-900/20 dark:text-purple-200">
                Zero-knowledge sharing is coming soon. We’ll reopen this button once the Moonbase proving
                pipeline is stable.
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                onClick={handleShare}
              >
                <ShareIcon className="mr-2 h-5 w-5" />
                {SHARE_TEXT}
              </button>
              {onShowWordDetails && (
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  onClick={onShowWordDetails}
                >
                  <BookOpenIcon className="mr-2 h-5 w-5" />
                  Review word details
                </button>
              )}
              {onNextWord && (
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  onClick={onNextWord}
                >
                  <ArrowRightIcon className="mr-2 h-5 w-5" />
                  Play next Worboo word
                </button>
              )}
            </div>

            {shareFeedback && (
              <p className="text-center text-xs font-medium text-green-600 dark:text-green-400">{shareFeedback}</p>
            )}
          </div>
          <div className="mt-5 sm:mt-6 dark:text-white">
            <div>
              <h5>{NEW_WORD_TEXT}</h5>
              <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {nextUnlockLabel}
              </span>
            </div>
          </div>
        </>
      )}
      {ENABLE_MIGRATE_STATS && (
        <div>
          <hr className="mt-4 -mb-4 border-gray-500" />
          <MigrationIntro handleMigrateStatsButton={handleMigrateStatsButton} />
        </div>
      )}
    </BaseModal>
  )
}

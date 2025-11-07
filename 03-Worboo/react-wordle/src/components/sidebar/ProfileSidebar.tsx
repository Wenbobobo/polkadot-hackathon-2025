import { Fragment, useMemo, useState } from 'react'
import { Dialog, Transition, Disclosure } from '@headlessui/react'
import {
  XIcon,
  UserIcon,
  UsersIcon,
  ChartBarIcon,
  BookOpenIcon,
  GiftIcon,
  ChevronDownIcon,
  PlusIcon,
  ClipboardCopyIcon,
} from '@heroicons/react/outline'
import { FriendSearchModal } from '../modals/FriendSearchModal'
import { FriendProfileCard } from '../friends/FriendProfileCard'
import {
  FRIEND_ADD_BUTTON,
  FRIEND_LIST_TITLE,
  FRIEND_PROFILE_CHALLENGE_BUTTON,
  FRIEND_PROFILE_LEVEL,
  FRIEND_PROFILE_OCID,
  FRIEND_PROFILE_COPY_OCID,
  FRIEND_PROFILE_COPIED_OCID,
} from '../../constants/strings'
import { derivePolkaId, formatAddress, copyToClipboard } from '../../utils/polkaId'
import type { WorbooFriend } from '../../types/friend'

type DisclosureRenderProps = {
  open: boolean
}

interface Props {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  playerAddress?: string
}

type Friend = WorbooFriend

const ACTIVITY_ROWS = 7
const ACTIVITY_COLS = 20

const generateContributionMatrix = (seed: string) => {
  let hash = 0
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }

  const matrix: number[][] = []
  for (let row = 0; row < ACTIVITY_ROWS; row++) {
    const currentRow: number[] = []
    for (let col = 0; col < ACTIVITY_COLS; col++) {
      hash = (hash * 1664525 + 1013904223) >>> 0
      currentRow.push(hash % 4)
    }
    matrix.push(currentRow)
  }
  return matrix
}

const WORBOO_BADGES: Array<{ id: string; label: string; image: string }> = [
  { id: 'alpha', label: 'Alpha Explorer', image: '/worboo/worboo-sunglass.png' },
  { id: 'relay', label: 'Relay Ranger', image: '/worboo/worboo-unruly.png' },
  { id: 'moonbase', label: 'Moonbase MVP', image: '/worboo/worboo-redpepper.png' },
  { id: 'shop', label: 'Collectible Curator', image: '/worboo/worboo-like.png' },
]

export const ProfileSidebar = ({ isOpen, setIsOpen, playerAddress }: Props) => {
  const playerPolkaId = useMemo(() => derivePolkaId(playerAddress), [playerAddress])
  const displayAddress = formatAddress(playerAddress)
  const contributionMatrix = useMemo(
    () => generateContributionMatrix(playerAddress ?? 'worboo'),
    [playerAddress]
  )
  const activityScore = useMemo(
    () => contributionMatrix.flat().reduce((sum, value) => sum + value, 0),
    [contributionMatrix]
  )
  const playerLevel = useMemo(() => 10 + Math.floor(activityScore / 40), [activityScore])
  const playerHandle = playerAddress ? 'Worboo Pilot' : 'Guest Explorer'
  const badgeSlots = useMemo<(typeof WORBOO_BADGES[number] | null)[]>(() => {
    const slots: Array<typeof WORBOO_BADGES[number] | null> = [...WORBOO_BADGES]
    while (slots.length < 8) {
      slots.push(null)
    }
    return slots
  }, [])

  const [copiedPlayerId, setCopiedPlayerId] = useState(false)
  const [isFriendSearchOpen, setIsFriendSearchOpen] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [friends, setFriends] = useState<Friend[]>([
    {
      id: '1',
      username: 'Moonbase Mentor',
      level: 18,
      polkaId: 'PL-421084',
      bio: 'Guiding new pilots through Moonbase Alpha dailies.',
      lastActive: 'Today',
      worbooPet: '/worboo/worboo-sunglass.png',
      wallet: '0xB4c6a21f9F1223456789abcdEF1234567890abcd',
    },
    {
      id: '2',
      username: 'Relay Ranger',
      level: 24,
      polkaId: 'PL-982314',
      bio: 'Keeps the reward relayer humming—ping for tips!',
      lastActive: 'Yesterday',
      worbooPet: '/worboo/worboo-pig.png',
      wallet: '0xD2ff8934c2A0bE9a6789DCFE1234567890abCDEF',
    },
    {
      id: '3',
      username: 'Parachain Pro',
      level: 31,
      polkaId: 'PL-563204',
      bio: 'Farming streaks across every Polkadot parachain classroom.',
      lastActive: '3 days ago',
      worbooPet: '/worboo/worboo-redpepper.png',
      wallet: '0xA1c3dE5678901234ABCd5678901234abcdef5678',
    },
  ])
  
  const handleAddFriend = (newFriend: Friend) => {
    setFriends((prev) => [
      ...prev,
      {
        ...newFriend,
        lastActive: 'Just now',
      },
    ])
  }

  const handleCopyPlayerId = async () => {
    const valueToCopy = playerAddress ?? playerPolkaId
    if (!valueToCopy) return
    const success = await copyToClipboard(valueToCopy)
    if (success) {
      setCopiedPlayerId(true)
      setTimeout(() => setCopiedPlayerId(false), 1500)
    }
  }
  
  const openFriendProfile = (friend: Friend) => {
    setSelectedFriend(friend)
  }
  
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto relative w-96">
                  <div className="flex h-full flex-col overflow-y-auto bg-white dark:bg-gray-900 shadow-xl">
                    <div className="px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-xl font-semibold leading-6 text-gray-900 dark:text-gray-100">
                          Profile
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                            onClick={() => setIsOpen(false)}
                          >
                            <XIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* User Info */}
                    <div className="px-4 py-5 sm:px-6 border-t border-gray-200 dark:border-gray-700">
                      {/* Avatar and Basic Info */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-4">
                          <div className="relative group">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center transform transition-all duration-200 group-hover:scale-105 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-blue-500/50">
                              <UserIcon className="h-8 w-8 text-white" />
                            </div>
                            <div className="absolute -bottom-1 right-0 h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                              <span className="text-xs font-bold text-white">{playerLevel}</span>
                            </div>
                          </div>
                          <div className="pt-1">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{playerHandle}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{playerPolkaId}</p>
                          </div>
                        </div>
                        <button 
                          className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
                          onClick={() => setIsFriendSearchOpen(true)}
                        >
                          <PlusIcon className="h-4 w-4 mr-1.5" />
                          {FRIEND_ADD_BUTTON}
                        </button>
                      </div>

                      {/* OCID and Bio */}
                      <div className="mt-4 space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 border border-gray-200 dark:border-gray-700">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {FRIEND_PROFILE_OCID}
                              </span>
                              <code className="px-2.5 py-1 text-sm font-mono font-medium bg-white dark:bg-gray-800 rounded-md text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-gray-700">
                                {playerPolkaId}
                              </code>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                              <span className="uppercase tracking-wide">Wallet</span>
                              <span className="font-mono text-gray-600 dark:text-gray-300">{displayAddress}</span>
                            </div>
                          </div>
                          <button
                            className="group p-1.5 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors focus:outline-none"
                            title={copiedPlayerId ? FRIEND_PROFILE_COPIED_OCID : FRIEND_PROFILE_COPY_OCID}
                            onClick={() => void handleCopyPlayerId()}
                          >
                            <ClipboardCopyIcon
                              className={`h-5 w-5 transition-transform group-hover:scale-110 ${copiedPlayerId ? 'text-green-500' : ''}`}
                            />
                          </button>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          Completing word quests across Polkadot classrooms. Earn WBOO, unlock collectibles, and bring new
                          learners into the Worboo universe.
                        </p>
                      </div>
                    </div>

                    {/* Contribution Graph */}
                    <div className="px-4 py-6 sm:px-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Activity</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Score:</span>
                        <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                          {activityScore * 12}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {contributionMatrix.map((rowValues, row) => (
                        <div key={row} className="flex gap-1 justify-center">
                          {rowValues.map((value, col) => {
                            return (
                              <div
                                key={`${row}-${col}`}
                                className={`
                                    w-3 h-3 rounded-sm
                                    ${value === 0 ? 'bg-gray-200 dark:bg-gray-700' :
                                      value === 1 ? 'bg-green-300 dark:bg-green-700' :
                                      value === 2 ? 'bg-green-500 dark:bg-green-600' :
                                      'bg-green-700 dark:bg-green-500'}
                                  `}
                                  title={`${value} contributions`}
                                />
                              )
                            })}
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Less</span>
                        <div className="flex gap-1">
                          <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" />
                          <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-700" />
                          <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600" />
                          <div className="w-3 h-3 rounded-sm bg-green-700 dark:bg-green-500" />
                        </div>
                        <span>More</span>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="px-4 py-6 sm:px-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="space-y-2">
                        <Disclosure>
                          {({ open }) => (
                            <>
                              <Disclosure.Button className="flex w-full items-center justify-between rounded-lg bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-left hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                                <div className="flex items-center space-x-3">
                                  <UsersIcon className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                                  <span className="font-medium text-blue-900 dark:text-blue-100">{FRIEND_LIST_TITLE}</span>
                                </div>
                                <ChevronDownIcon
                                  className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-blue-500`}
                                />
                              </Disclosure.Button>
                              <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-600 dark:text-gray-300">
                                <div className="space-y-3">
                                  {friends.map((friend) => (
                                    <div key={friend.id} className="flex items-center justify-between">
                                      <div 
                                        className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg w-full transition-colors"
                                        onClick={() => openFriendProfile(friend)}
                                      >
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                          <span className="text-white font-bold">{friend.username.charAt(0)}</span>
                                        </div>
                                        <div>
                                          <div className="font-medium">{friend.username}</div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {FRIEND_PROFILE_LEVEL} {friend.level} • {friend.polkaId}
                                          </div>
                                        </div>
                                      </div>
                                      <button className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                                        {FRIEND_PROFILE_CHALLENGE_BUTTON}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </Disclosure.Panel>
                            </>
                          )}
                        </Disclosure>

                        <Disclosure>
                          {({ open }) => (
                            <>
                              <Disclosure.Button className="flex w-full items-center justify-between rounded-lg bg-green-50 dark:bg-green-900/20 px-4 py-3 text-left hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                                <div className="flex items-center space-x-3">
                                  <ChartBarIcon className="h-6 w-6 text-green-500 dark:text-green-400" />
                                  <span className="font-medium text-green-900 dark:text-green-100">Global Leaderboard</span>
                                </div>
                                <ChevronDownIcon
                                  className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-green-500`}
                                />
                              </Disclosure.Button>
                              <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-600 dark:text-gray-300">
                                <div className="space-y-3">
                                  {[1,2,3].map((rank) => (
                                    <div key={rank} className="flex items-center space-x-4">
                                      <span className="font-bold text-lg w-6">{rank}</span>
                                      <div className="flex items-center space-x-3 flex-1">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-yellow-500 to-red-500"></div>
                                        <div>
                                          <div className="font-medium">Top Player {rank}</div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">Score: {10000 - rank * 1000}</div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </Disclosure.Panel>
                            </>
                          )}
                        </Disclosure>

                        <Disclosure>
                          {({ open }) => (
                            <>
                              <Disclosure.Button className="flex w-full items-center justify-between rounded-lg bg-purple-50 dark:bg-purple-900/20 px-4 py-3 text-left hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                                <div className="flex items-center space-x-3">
                                  <GiftIcon className="h-6 w-6 text-purple-500 dark:text-purple-400" />
                                  <span className="font-medium text-purple-900 dark:text-purple-100">Worboo Badge</span>
                                </div>
                                <ChevronDownIcon
                                  className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-purple-500`}
                                />
                              </Disclosure.Button>
                              <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-600 dark:text-gray-300">
                                <div className="grid grid-cols-4 gap-2">
                                  {badgeSlots.map((badge, index) => (
                                    <div
                                      key={badge?.id ?? `locked-${index}`}
                                      className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden hover:border-purple-500 dark:hover:border-purple-400 transition-colors"
                                    >
                                      {badge ? (
                                        <>
                                          <img
                                            src={badge.image}
                                            alt={badge.label}
                                            className="h-full w-full object-cover"
                                          />
                                          <span className="absolute bottom-1 left-1 right-1 rounded-md bg-purple-600/80 px-1 text-[10px] font-semibold text-white text-center">
                                            {badge.label}
                                          </span>
                                        </>
                                      ) : (
                                        <span className="text-xs text-gray-400 dark:text-gray-500">Locked</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </Disclosure.Panel>
                            </>
                          )}
                        </Disclosure>

                        <Disclosure>
                          {({ open }) => (
                            <>
                              <Disclosure.Button className="flex w-full items-center justify-between rounded-lg bg-orange-50 dark:bg-orange-900/20 px-4 py-3 text-left hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                                <div className="flex items-center space-x-3">
                                  <BookOpenIcon className="h-6 w-6 text-orange-500 dark:text-orange-400" />
                                  <span className="font-medium text-orange-900 dark:text-orange-100">NFT Season</span>
                                </div>
                                <ChevronDownIcon
                                  className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-orange-500`}
                                />
                              </Disclosure.Button>
                              <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-600 dark:text-gray-300">
                                <div className="space-y-4">
                                  {[1,2].map((season) => (
                                    <div key={season} className="space-y-2">
                                      <h4 className="font-medium text-base">Season {season}</h4>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {season === 1 ? 'The beginning of your Worboo journey...' : 'More adventures await...'}
                                      </p>
                                      <div className="h-24 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-white font-medium">
                                        {season === 1 ? 'Unlocked' : 'Locked'}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </Disclosure.Panel>
                            </>
                          )}
                        </Disclosure>
                      </div>
                    </nav>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
      
      {/* Friend Search Modal */}
      <FriendSearchModal 
        isOpen={isFriendSearchOpen}
        handleClose={() => setIsFriendSearchOpen(false)}
        onAddFriend={handleAddFriend}
      />
      
      {/* Friend Profile Card */}
      {selectedFriend && (
        <FriendProfileCard
          friend={selectedFriend}
          isOpen={!!selectedFriend}
          onClose={() => setSelectedFriend(null)}
        />
      )}
    </Transition.Root>
  )
}

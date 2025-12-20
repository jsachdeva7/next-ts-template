'use client'

import { logger } from '@/lib/logger'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useChannel,
  type ChannelStatus,
  type UseChannelOptions
} from './useChannel'

export interface PresencePeer {
  /** Presence key (typically user ID) */
  key: string
  /** Array of presence states for this peer */
  states: unknown[]
}

/**
 * Raw presence state from Supabase (key -> states[]).
 */
type RawPresenceState = Record<string, unknown[]>

export interface UsePresenceOptions extends Omit<
  UseChannelOptions,
  'channelConfig'
> {
  /**
   * Presence key for the current user (typically user ID).
   * If not provided, presence will still work but you won't be able to track your own state.
   */
  key?: string
  /**
   * Initial presence state to track.
   * If provided, will automatically track this state when connected.
   */
  state?: Record<string, unknown>
  /**
   * Whether to automatically track the state when connected.
   * @default true if state is provided, false otherwise
   */
  autoTrack?: boolean
}

export interface UsePresenceReturn {
  /**
   * Current connection status of the channel.
   */
  status: ChannelStatus
  /**
   * Normalized array of peers currently present on the channel.
   */
  peers: PresencePeer[]
  /**
   * Raw presence state map from Supabase (key -> states[]).
   */
  rawPresenceState: Record<string, unknown[]>
  /**
   * Track or update your presence state.
   *
   * @param state - The presence state to track
   *
   * @example
   * ```tsx
   * track({ userId: '123', name: 'John', status: 'active' })
   * ```
   */
  track: (state: Record<string, unknown>) => void
  /**
   * Check if a specific key is currently online.
   *
   * @param key - The presence key to check
   * @returns true if the key has presence state
   */
  isOnline: (key: string) => boolean
  /**
   * Get the count of peers currently present.
   */
  peersCount: number
}

/**
 * Hook for tracking and listening to presence state on a Supabase Realtime channel.
 *
 * Wraps useChannel with presence configuration to provide a simple API for
 * tracking who's online and their ephemeral state. All presence handlers are
 * automatically cleaned up when the channel is removed.
 *
 * @param channelName - The name of the channel to use (typically presence:topic:*)
 * @param options - Optional configuration including presence key, state, and channel options
 * @returns Status, peers, and presence tracking methods
 *
 * @example
 * ```tsx
 * const { status, peers, track, isOnline } = usePresence(
 *   presence('room', 'general'),
 *   {
 *     key: userId,
 *     state: { name: 'John', status: 'active' },
 *     autoTrack: true
 *   }
 * )
 *
 * // Check who's online
 * peers.forEach(peer => {
 *   console.log(`${peer.key} is online:`, peer.states)
 * })
 *
 * // Update your presence
 * track({ status: 'away' })
 * ```
 */
export function usePresence(
  channelName: string,
  options: UsePresenceOptions = {}
): UsePresenceReturn {
  const { key, state, autoTrack = !!state, ...channelOptions } = options

  // Build channel config with presence key if provided
  const channelConfig = useMemo(() => {
    if (!key) return undefined
    return {
      config: {
        presence: {
          key
        }
      }
    }
  }, [key])

  const { channel, status } = useChannel(channelName, {
    ...channelOptions,
    channelConfig
  })

  const [rawPresenceState, setRawPresenceState] = useState<RawPresenceState>({})
  const registeredForRef = useRef<RealtimeChannel | null>(null)
  const debugLabelRef = useRef(channelOptions.debugLabel)

  // Keep debugLabel ref up to date
  useEffect(() => {
    debugLabelRef.current = channelOptions.debugLabel
  }, [channelOptions.debugLabel])

  // Normalize presence state to peers array
  const peers = useMemo<PresencePeer[]>(() => {
    return Object.entries(rawPresenceState).map(([peerKey, states]) => ({
      key: peerKey,
      states
    }))
  }, [rawPresenceState])

  // Register presence handlers exactly once per channel instance
  useEffect(() => {
    if (!channel) {
      return
    }

    // Skip if already registered for this channel instance
    if (registeredForRef.current === channel) {
      return
    }

    registeredForRef.current = channel

    if (debugLabelRef.current) {
      logger.debug(
        `[Realtime:${debugLabelRef.current}] Registering presence handlers`
      )
    }

    // Handle presence sync (initial state)
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState()
      if (debugLabelRef.current) {
        logger.debug(
          `[Realtime:${debugLabelRef.current}] Presence sync:`,
          Object.keys(presenceState).length,
          'peers'
        )
      }
      setRawPresenceState(presenceState as RawPresenceState)
    })

    // Handle presence join
    channel.on(
      'presence',
      { event: 'join' },
      ({ key: peerKey, newPresences }) => {
        if (debugLabelRef.current) {
          logger.debug(
            `[Realtime:${debugLabelRef.current}] Presence join:`,
            peerKey,
            newPresences
          )
        }
        // Update state by getting fresh presence state
        const presenceState = channel.presenceState()
        setRawPresenceState(presenceState as RawPresenceState)
      }
    )

    // Handle presence leave
    channel.on(
      'presence',
      { event: 'leave' },
      ({ key: peerKey, leftPresences }) => {
        if (debugLabelRef.current) {
          logger.debug(
            `[Realtime:${debugLabelRef.current}] Presence leave:`,
            peerKey,
            leftPresences
          )
        }
        // Update state by getting fresh presence state
        const presenceState = channel.presenceState()
        setRawPresenceState(presenceState as RawPresenceState)
      }
    )

    // Cleanup: reset registeredForRef when channel changes/unmounts
    return () => {
      registeredForRef.current = null
    }
  }, [channel])

  // Auto-track state when connected (if autoTrack is enabled)
  // Uses a small delay to ensure channel is fully ready
  useEffect(() => {
    if (!channel || status !== 'connected' || !autoTrack || !state) {
      return
    }

    // Small delay to ensure channel is fully ready
    const timeoutId = setTimeout(() => {
      if (debugLabelRef.current) {
        logger.debug(
          `[Realtime:${debugLabelRef.current}] Auto-tracking presence state`
        )
      }
      channel.track(state)
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [channel, status, autoTrack, state])

  /**
   * Track or update presence state.
   */
  const track = useCallback(
    (newState: Record<string, unknown>) => {
      if (!channel || status !== 'connected') {
        if (debugLabelRef.current) {
          logger.debug(
            `[Realtime:${debugLabelRef.current}] Cannot track: channel not connected (status: ${status})`
          )
        }
        return
      }

      if (debugLabelRef.current) {
        logger.debug(
          `[Realtime:${debugLabelRef.current}] Tracking presence:`,
          newState
        )
      }

      channel.track(newState)
    },
    [channel, status]
  )

  /**
   * Check if a specific key is currently online.
   */
  const isOnline = useCallback(
    (checkKey: string): boolean => {
      return (
        checkKey in rawPresenceState && rawPresenceState[checkKey].length > 0
      )
    },
    [rawPresenceState]
  )

  return {
    status,
    peers,
    rawPresenceState,
    track,
    isOnline,
    peersCount: peers.length
  }
}

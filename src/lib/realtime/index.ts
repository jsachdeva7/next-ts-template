/**
 * Public API for Supabase Realtime functionality.
 *
 * This module provides a domain-agnostic "live comms" layer built on Supabase Realtime.
 * All hooks handle lifecycle and cleanup automatically to prevent leaks.
 *
 * @example
 * ```tsx
 * import { useBroadcast, usePresence, live, presence } from '@/lib/realtime'
 *
 * // Use broadcast for one-to-many messaging
 * const { send, on } = useBroadcast(live('game', '123'))
 *
 * // Use presence to track who's online
 * const { peers, track } = usePresence(presence('room', 'general'), { key: userId })
 * ```
 */

// Hooks
export { useBroadcast, type UseBroadcastReturn } from './useBroadcast'
export {
  useChannel,
  type ChannelStatus,
  type UseChannelOptions
} from './useChannel'
export {
  usePresence,
  type PresencePeer,
  type UsePresenceOptions,
  type UsePresenceReturn
} from './usePresence'

// Channel naming helpers
export {
  channel,
  encodeSegment,
  live,
  liveTopic,
  presence,
  presenceTopic,
  realtimeNamespaces,
  topic,
  type Namespace
} from './channels'

// Event types and constants
export {
  REALTIME_ENVELOPE_VERSION,
  realtimeEvents,
  type RealtimeEnvelope,
  type RealtimeError,
  type RealtimeLiveEvent
} from './types'

// Client factory (for advanced use cases)
export { createRealtimeClient } from './client'

/**
 * Channel naming conventions and helpers for Supabase Realtime.
 *
 * Provides consistent channel name generation to prevent magic strings,
 * naming collisions, and routing/permission issues.
 */

/**
 * Realtime channel namespaces.
 */
export const realtimeNamespaces = {
  /** Data plane: live updates, snapshots, deltas */
  live: 'live',
  /** Presence plane: who's online, ephemeral state */
  presence: 'presence'
} as const

export type Namespace =
  (typeof realtimeNamespaces)[keyof typeof realtimeNamespaces]

/**
 * Sanitizes a channel name segment to avoid issues with Supabase channel names.
 *
 * Removes spaces, restricts to safe characters, and ensures it's not empty.
 *
 * @param segment - The segment to sanitize
 * @returns Sanitized segment safe for use in channel names
 *
 * @example
 * ```ts
 * encodeSegment('general chat') // 'general_chat'
 * encodeSegment('room-123')     // 'room-123'
 * ```
 */
export function encodeSegment(segment: string): string {
  if (!segment) {
    throw new Error('Channel segment cannot be empty')
  }

  const sanitized = segment
    .trim()
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[^a-zA-Z0-9:_-]/g, '') // Remove unsafe characters
    .replace(/_{2,}/g, '_') // Collapse multiple underscores
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores

  if (!sanitized) {
    throw new Error(
      `Channel segment "${segment}" became empty after sanitization`
    )
  }

  return sanitized
}

/**
 * Builds a topic channel name using the convention: topic:<type>:<id>
 *
 * @param type - The resource type (e.g., 'game', 'room', 'doc', 'user')
 * @param id - The resource identifier
 * @returns Channel name in the format topic:<type>:<id>
 *
 * @example
 * ```ts
 * topic('game', '123')     // 'topic:game:123'
 * topic('room', 'general') // 'topic:room:general'
 * ```
 */
export function topic(type: string, id: string): string {
  const sanitizedType = encodeSegment(type)
  const sanitizedId = encodeSegment(id)
  return `topic:${sanitizedType}:${sanitizedId}`
}

/**
 * Builds a channel name by combining a namespace and topic.
 *
 * @param namespace - The namespace (live or presence)
 * @param topicName - The topic name (should be a pre-built topic string from topic())
 * @returns Channel name in the format <namespace>:<topic>
 *
 * @example
 * ```ts
 * channel('live', topic('game', '123'))  // 'live:topic:game:123'
 * channel('presence', topic('room', 'abc'))  // 'presence:topic:room:abc'
 * ```
 */
export function channel(namespace: Namespace, topicName: string): string {
  // Trust the topic string - it should already be sanitized by topic()
  return `${namespace}:${topicName}`
}

/**
 * Builds a live (data plane) channel name for a topic.
 *
 * @param type - The resource type
 * @param id - The resource identifier
 * @returns Channel name in the format live:topic:<type>:<id>
 *
 * @example
 * ```ts
 * live('game', '123')  // 'live:topic:game:123'
 * live('room', 'abc')  // 'live:topic:room:abc'
 * ```
 */
export function live(type: string, id: string): string {
  return channel(realtimeNamespaces.live, topic(type, id))
}

/**
 * Builds a presence channel name for a topic.
 *
 * @param type - The resource type
 * @param id - The resource identifier
 * @returns Channel name in the format presence:topic:<type>:<id>
 *
 * @example
 * ```ts
 * presence('room', 'general')  // 'presence:topic:room:general'
 * presence('doc', 'abc')       // 'presence:topic:doc:abc'
 * ```
 */
export function presence(type: string, id: string): string {
  return channel(realtimeNamespaces.presence, topic(type, id))
}

/**
 * Legacy aliases for backward compatibility (if needed).
 * These build the full channel name directly.
 */
export const liveTopic = live
export const presenceTopic = presence

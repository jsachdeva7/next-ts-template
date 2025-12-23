/**
 * Standard event names and message envelope types for Supabase Realtime.
 *
 * Defines the contract that all realtime features agree on for consistent
 * event naming and message shapes across the application.
 */

/**
 * Realtime event names organized by plane.
 */
export const realtimeEvents = {
  /** Data plane events: live updates, snapshots, deltas */
  live: {
    snapshot: 'snapshot',
    delta: 'delta',
    error: 'error'
  }
} as const

/**
 * Data plane event names (live updates).
 */
export type RealtimeLiveEvent =
  (typeof realtimeEvents.live)[keyof typeof realtimeEvents.live]

/**
 * Standard error shape for realtime messages.
 */
export interface RealtimeError {
  /** Optional error code for programmatic handling */
  code?: string
  /** Human-readable error message */
  message: string
}

/**
 * Current envelope version.
 */
export const REALTIME_ENVELOPE_VERSION = 1

/**
 * Standard message envelope for realtime events.
 *
 * Provides consistent metadata for versioning, debugging, analytics, and
 * cross-app consistency. Envelopes are optional - features can send raw
 * payloads or wrapped envelopes.
 *
 * @template T - Type of the data payload
 */
export interface RealtimeEnvelope<T = unknown> {
  /** Envelope version (for future compatibility) */
  v: typeof REALTIME_ENVELOPE_VERSION
  /** ISO timestamp when the message was created */
  ts: string
  /** Topic identifier (e.g., "topic:game:123") */
  topic: string
  /** Event type name (e.g., "snapshot", "delta") - can be a known event or custom string */
  type: RealtimeLiveEvent | (string & {})
  /** The actual data payload */
  data: T
}

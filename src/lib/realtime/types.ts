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
  },
  /** Control plane events: RPC calls, notifications */
  ctrl: {
    rpc: 'rpc',
    rpcAck: 'rpc_ack',
    notify: 'notify'
  }
} as const

/**
 * Data plane event names (live updates).
 */
export type RealtimeLiveEvent =
  (typeof realtimeEvents.live)[keyof typeof realtimeEvents.live]

/**
 * Control plane event names (RPC/commands).
 */
export type RealtimeCtrlEvent =
  (typeof realtimeEvents.ctrl)[keyof typeof realtimeEvents.ctrl]

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
 * RPC request payload shape.
 *
 * @template TParams - Type of the parameters being sent
 */
export interface RpcRequest<TParams = unknown> {
  /** Unique request identifier for correlating responses */
  requestId: string
  /** The action name to call */
  action: string
  /** Parameters for the action */
  params: TParams
  /** Optional resource identifier for routing and authorization */
  resource?: {
    /** The domain of the resource (e.g., 'doc', 'comment') */
    domain: string
    /** The resource identifier (e.g., docId, commentId) */
    resourceId: string
  }
}

/**
 * RPC acknowledgment payload shape.
 *
 * @template TResult - Type of the result data
 */
export interface RpcAck<TResult = unknown> {
  /** Request identifier to correlate with the original request */
  requestId: string
  /** Whether the RPC call succeeded */
  ok: boolean
  /** Result data (present when ok is true) */
  data?: TResult
  /** Error message (present when ok is false) */
  error?: string
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
  /** Event type name (e.g., "snapshot", "delta", "rpc") - can be a known event or custom string */
  type: RealtimeLiveEvent | RealtimeCtrlEvent | (string & {})
  /** The actual data payload */
  data: T
}

'use client'

import { logger } from '@/lib/logger'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef } from 'react'
import { useBroadcast } from './useBroadcast'
import type { ChannelStatus, UseChannelOptions } from './useChannel'

type PendingRequest = {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timeoutId: ReturnType<typeof setTimeout>
  action: string
}

export interface UseRpcOptions extends UseChannelOptions {
  /**
   * Default timeout in milliseconds for RPC calls.
   * @default 5000
   */
  defaultTimeoutMs?: number
  /**
   * Maximum number of pending requests before rejecting new calls.
   * Prevents memory blowups if responses stop arriving.
   * @default 200
   */
  maxPending?: number
}

export interface UseRpcReturn {
  /**
   * Current connection status of the channel.
   */
  status: ChannelStatus
  /**
   * Call a remote action and wait for a response.
   *
   * @param action - The action name to call
   * @param params - Parameters to send with the request
   * @param options - Optional timeout override
   * @returns Promise that resolves with the result or rejects on error/timeout
   *
   * @example
   * ```tsx
   * try {
   *   const result = await call('updateUser', { userId: '123', name: 'John' })
   *   console.log('Success:', result)
   * } catch (error) {
   *   console.error('RPC failed:', error)
   * }
   * ```
   */
  call: <TParams = unknown, TResult = unknown>(
    action: string,
    params: TParams,
    options?: { timeoutMs?: number }
  ) => Promise<TResult>
  /**
   * Send a fire-and-forget notification (no response expected).
   *
   * @param action - The action name to notify
   * @param params - Parameters to send with the notification
   *
   * @example
   * ```tsx
   * notify('logEvent', { event: 'click', timestamp: Date.now() })
   * ```
   */
  notify: <TParams = unknown>(action: string, params: TParams) => Promise<void>
}

/**
 * Hook for bidirectional request/response communication over Supabase Realtime.
 *
 * Implements an RPC pattern on top of broadcast channels. Sends requests via
 * 'rpc' events and correlates responses via 'rpc_ack' events using request IDs.
 * Fire-and-forget notifications use 'notify' events (no response expected).
 *
 * @param channelName - The name of the channel to use (typically 'ctrl:*')
 * @param options - Optional configuration including timeout and max pending limits
 * @returns Status and call/notify methods
 *
 * @example
 * ```tsx
 * const { status, call, notify } = useRpc('ctrl:worker', {
 *   defaultTimeoutMs: 10000,
 *   debugLabel: 'worker-rpc'
 * })
 *
 * // Make a call and wait for response
 * const result = await call('processData', { data: [...] })
 *
 * // Fire and forget
 * await notify('logEvent', { event: 'click' })
 * ```
 */
export function useRpc(
  channelName: string,
  options: UseRpcOptions = {}
): UseRpcReturn {
  const {
    defaultTimeoutMs = 5000,
    maxPending = 200,
    ...channelOptions
  } = options

  const { status, send, on, channel } = useBroadcast(
    channelName,
    channelOptions
  )

  // Store pending requests in a ref to avoid stale closures
  const pendingRef = useRef<Map<string, PendingRequest>>(new Map())
  const debugLabelRef = useRef(channelOptions.debugLabel)
  const registeredForRef = useRef<RealtimeChannel | null>(null)

  // Keep debugLabel ref up to date
  useEffect(() => {
    debugLabelRef.current = channelOptions.debugLabel
  }, [channelOptions.debugLabel])

  // Register rpc_ack handler exactly once per channel instance
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
        `[Realtime:${debugLabelRef.current}] Registering rpc_ack handler`
      )
    }

    on<{ requestId: string; ok: boolean; data?: unknown; error?: string }>(
      'rpc_ack',
      ({ requestId, ok, data, error }) => {
        const pending = pendingRef.current.get(requestId)
        if (!pending) {
          // Response for unknown request (might be from previous session or duplicate)
          if (debugLabelRef.current) {
            logger.debug(
              `[Realtime:${debugLabelRef.current}] Received rpc_ack for unknown requestId: ${requestId}`
            )
          }
          return
        }

        // Clean up timeout
        clearTimeout(pending.timeoutId)
        pendingRef.current.delete(requestId)

        if (debugLabelRef.current) {
          logger.debug(
            `[Realtime:${debugLabelRef.current}] Received rpc_ack for "${pending.action}":`,
            ok ? 'success' : `error: ${error}`
          )
        }

        if (ok) {
          pending.resolve(data)
        } else {
          pending.reject(
            new Error(
              error || `RPC "${pending.action}" failed without error message`
            )
          )
        }
      }
    )
  }, [channel, on])

  // Clean up on unmount: reject all pending promises and clear timeouts
  useEffect(() => {
    // Capture current ref value at effect creation time
    const pending = pendingRef.current
    return () => {
      const unmountError = new Error('RPC cancelled: component unmounted')

      for (const [
        requestId,
        { timeoutId, action, reject }
      ] of pending.entries()) {
        clearTimeout(timeoutId)
        reject(unmountError)

        if (debugLabelRef.current) {
          logger.debug(
            `[Realtime:${debugLabelRef.current}] Cleaning up pending RPC "${action}" (requestId: ${requestId})`
          )
        }
      }

      pending.clear()
      registeredForRef.current = null
    }
  }, [])

  /**
   * Call a remote action and wait for a response.
   */
  const call = useCallback(
    <TParams = unknown, TResult = unknown>(
      action: string,
      params: TParams,
      options?: { timeoutMs?: number }
    ): Promise<TResult> => {
      // Throw if channel is not connected
      if (status !== 'connected') {
        const error = new Error(`Channel not connected (status: ${status})`)
        if (debugLabelRef.current) {
          logger.debug(
            `[Realtime:${debugLabelRef.current}] Cannot call "${action}": ${error.message}`
          )
        }
        return Promise.reject(error)
      }

      // Check max pending limit
      if (pendingRef.current.size >= maxPending) {
        const error = new Error(
          `Too many pending RPC calls (${pendingRef.current.size}/${maxPending}). Rejecting new call to "${action}"`
        )
        if (debugLabelRef.current) {
          logger.warn(`[Realtime:${debugLabelRef.current}] ${error.message}`)
        }
        return Promise.reject(error)
      }

      const requestId = crypto.randomUUID()
      const timeoutMs = options?.timeoutMs ?? defaultTimeoutMs

      if (debugLabelRef.current) {
        logger.debug(
          `[Realtime:${debugLabelRef.current}] Calling "${action}" (requestId: ${requestId}, timeout: ${timeoutMs}ms)`
        )
      }

      return new Promise<TResult>((resolve, reject) => {
        // Set up timeout
        const timeoutId = setTimeout(() => {
          const pending = pendingRef.current.get(requestId)
          if (pending) {
            pendingRef.current.delete(requestId)
            const error = new Error(
              `RPC "${action}" timed out after ${timeoutMs}ms`
            )
            if (debugLabelRef.current) {
              logger.warn(
                `[Realtime:${debugLabelRef.current}] ${error.message}`
              )
            }
            reject(error)
          }
        }, timeoutMs)

        // Store pending request
        pendingRef.current.set(requestId, {
          resolve: resolve as (value: unknown) => void,
          reject,
          timeoutId,
          action
        })

        // Send RPC request
        send('rpc', { requestId, action, params }).catch(error => {
          // If send fails, clean up and reject
          const pending = pendingRef.current.get(requestId)
          if (pending) {
            clearTimeout(pending.timeoutId)
            pendingRef.current.delete(requestId)
          }
          reject(error)
        })
      })
    },
    [status, send, defaultTimeoutMs, maxPending]
  )

  /**
   * Send a fire-and-forget notification (no response expected).
   */
  const notify = useCallback(
    <TParams = unknown>(action: string, params: TParams): Promise<void> => {
      if (debugLabelRef.current) {
        logger.debug(
          `[Realtime:${debugLabelRef.current}] Notifying "${action}" (fire-and-forget)`
        )
      }
      // Use 'notify' event instead of 'rpc' for clarity (no response expected)
      return send('notify', { action, params })
    },
    [send]
  )

  return {
    status,
    call,
    notify
  }
}

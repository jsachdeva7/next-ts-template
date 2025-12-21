'use client'

import { logger } from '@/lib/logger'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef } from 'react'
import {
  useChannel,
  type ChannelStatus,
  type UseChannelOptions
} from './useChannel'

export interface UseBroadcastReturn {
  /**
   * Current connection status of the channel.
   */
  status: ChannelStatus
  /**
   * The underlying channel instance (for power users who need low-level access).
   */
  channel: RealtimeChannel | null
  /**
   * Send a broadcast message on the channel.
   *
   * @param event - The event name to broadcast
   * @param payload - The payload to send
   * @throws Error if the channel is not connected or sending fails
   *
   * @example
   * ```tsx
   * try {
   *   await send('chat_msg', { text: 'Hello', userId: '123' })
   * } catch (error) {
   *   console.error('Failed to send:', error)
   * }
   * ```
   */
  send: <T = unknown>(event: string, payload: T) => Promise<void>
  /**
   * Register a handler for a specific broadcast event.
   *
   * Call this inside a useEffect to avoid re-registering on every render.
   * The handler will be automatically cleaned up when the channel is removed.
   *
   * @param event - The event name to listen for
   * @param handler - Callback that receives the payload
   *
   * @example
   * ```tsx
   * useEffect(() => {
   *   on('update', (payload) => {
   *     console.log('Received update:', payload)
   *   })
   * }, [on])
   * ```
   */
  on: <T = unknown>(event: string, handler: (payload: T) => void) => void
}

/**
 * Hook for one-to-many broadcast messaging over Supabase Realtime.
 *
 * Wraps useChannel to provide a simple API for sending and receiving
 * broadcast events. All listeners are automatically cleaned up when
 * the channel is removed.
 *
 * @param channelName - The name of the channel to use
 * @param options - Optional channel configuration (same as useChannel)
 * @returns Status, channel, and send/on methods
 *
 * @example
 * ```tsx
 * const { status, send, on } = useBroadcast('live:chat')
 *
 * // Listen for messages
 * useEffect(() => {
 *   on('message', (payload) => {
 *     console.log('New message:', payload)
 *   })
 * }, [on])
 *
 * // Send a message
 * const handleSend = async () => {
 *   await send('message', { text: 'Hello!', userId: '123' })
 * }
 * ```
 */
export function useBroadcast(
  channelName: string,
  options: UseChannelOptions = {}
): UseBroadcastReturn {
  const { channel, status } = useChannel(channelName, options)
  const { debugLabel } = options

  // Store debugLabel in ref to avoid recreating callbacks when it changes
  const debugLabelRef = useRef(debugLabel)
  useEffect(() => {
    debugLabelRef.current = debugLabel
  }, [debugLabel])

  /**
   * Send a broadcast message on the channel.
   */
  const send = useCallback(
    async <T = unknown>(event: string, payload: T): Promise<void> => {
      // Throw if channel is not connected
      if (!channel || status !== 'connected') {
        const error = new Error(`Channel not connected (status: ${status})`)
        if (debugLabelRef.current) {
          logger.debug(
            `[Realtime:${debugLabelRef.current}] Cannot send "${event}": ${error.message}`
          )
        }
        throw error
      }

      if (debugLabelRef.current) {
        logger.debug(
          `[Realtime:${debugLabelRef.current}] Sending broadcast "${event}":`,
          payload
        )
      }

      try {
        const result = await channel.send({
          type: 'broadcast',
          event,
          payload
        })

        if (result === 'error') {
          const error = new Error(`Failed to send broadcast "${event}"`)
          if (debugLabelRef.current) {
            logger.error(
              `[Realtime:${debugLabelRef.current}] Send error:`,
              error
            )
          }
          throw error
        }

        // Log unexpected results for debugging
        if (result !== 'ok' && debugLabelRef.current) {
          logger.debug(
            `[Realtime:${debugLabelRef.current}] Send result for "${event}":`,
            result
          )
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        if (debugLabelRef.current) {
          logger.error(
            `[Realtime:${debugLabelRef.current}] Send exception:`,
            err
          )
        }
        throw err
      }
    },
    [channel, status]
  )

  /**
   * Register a handler for a specific broadcast event.
   */
  const on = useCallback(
    <T = unknown>(event: string, handler: (payload: T) => void): void => {
      // No-op if channel is null
      if (!channel) {
        if (debugLabelRef.current) {
          logger.debug(
            `[Realtime:${debugLabelRef.current}] Cannot register handler for "${event}": channel is null`
          )
        }
        return
      }

      if (debugLabelRef.current) {
        logger.debug(
          `[Realtime:${debugLabelRef.current}] Registering handler for "${event}"`
        )
      }

      // Register the broadcast listener
      // Note: Supabase doesn't provide a clean way to unsubscribe individual handlers,
      // so we rely on channel cleanup (via useChannel) to remove all listeners
      // Supabase's broadcast callback receives { event, payload, ... }
      channel.on('broadcast', { event }, msg => {
        if (debugLabelRef.current) {
          logger.debug(
            `[Realtime:${debugLabelRef.current}] Received broadcast "${event}":`,
            (msg as any).payload
          )
        }
        // Extract payload from the message object
        handler((msg as any).payload as T)
      })
    },
    [channel]
  )

  return {
    status,
    channel,
    send,
    on
  }
}

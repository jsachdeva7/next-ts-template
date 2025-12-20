'use client'

import { logger } from '@/lib/logger'
import type {
  RealtimeChannel,
  RealtimeChannelOptions
} from '@supabase/supabase-js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createRealtimeClient } from './client'

export type ChannelStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'errored'

export interface UseChannelOptions {
  /**
   * Callback invoked when the channel status changes.
   */
  onStatusChange?: (status: ChannelStatus) => void
  /**
   * Callback invoked when the channel successfully connects.
   * Useful for resyncing snapshots or refetching data.
   */
  onConnected?: () => void
  /**
   * Optional label for debug logging.
   */
  debugLabel?: string
  /**
   * Optional channel configuration (e.g., for presence).
   * Passed directly to supabase.channel(name, config).
   */
  channelConfig?: RealtimeChannelOptions
}

export interface UseChannelReturn {
  /**
   * The Supabase Realtime channel instance.
   * Use this to call .on(), .send(), etc.
   */
  channel: RealtimeChannel | null
  /**
   * Current connection status of the channel.
   */
  status: ChannelStatus
}

/**
 * Core hook for managing Supabase Realtime channel lifecycle.
 *
 * Creates, subscribes to, and cleans up a channel. Ensures no leaks by
 * properly closing channels on unmount or when channelName changes.
 *
 * @param channelName - The name of the channel to subscribe to
 * @param options - Optional callbacks and debug settings
 * @returns The channel instance and current status
 *
 * @example
 * ```tsx
 * const { channel, status } = useChannel('live:posts')
 *
 * useEffect(() => {
 *   if (!channel) return
 *
 *   channel.on('broadcast', { event: 'update' }, (payload) => {
 *     console.log('Received:', payload)
 *   })
 * }, [channel])
 * ```
 */
export function useChannel(
  channelName: string,
  options: UseChannelOptions = {}
): UseChannelReturn {
  const { onStatusChange, onConnected, debugLabel, channelConfig } = options

  // Get a stable Supabase client instance
  const supabase = useMemo(() => createRealtimeClient(), [])

  // Track channel and status
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [status, setStatus] = useState<ChannelStatus>('disconnected')

  // Store callbacks in refs to avoid effect dependency churn
  const onStatusChangeRef = useRef(onStatusChange)
  const onConnectedRef = useRef(onConnected)
  const debugLabelRef = useRef(debugLabel)

  // Keep callbacks and debugLabel refs up to date
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange
  }, [onStatusChange])

  useEffect(() => {
    onConnectedRef.current = onConnected
  }, [onConnected])

  useEffect(() => {
    debugLabelRef.current = debugLabel
  }, [debugLabel])

  useEffect(() => {
    // Skip if channelName is empty
    if (!channelName) {
      setChannel(null)
      setStatus('disconnected')
      return
    }

    // Active flag to guard against late async callbacks after cleanup
    let active = true

    // Update status and call callbacks (closes over active flag)
    const updateStatus = (newStatus: ChannelStatus) => {
      if (!active) return

      setStatus(newStatus)
      onStatusChangeRef.current?.(newStatus)

      if (newStatus === 'connected') {
        onConnectedRef.current?.()
      }

      if (debugLabelRef.current) {
        logger.debug(`[Realtime:${debugLabelRef.current}] Status: ${newStatus}`)
      }
    }

    // Create or get the channel
    const newChannel = channelConfig
      ? supabase.channel(channelName, channelConfig)
      : supabase.channel(channelName)
    setChannel(newChannel)
    updateStatus('connecting')

    if (debugLabelRef.current) {
      logger.debug(
        `[Realtime:${debugLabelRef.current}] Subscribing to channel: ${channelName}`
      )
    }

    // Subscribe to the channel
    newChannel.subscribe(status => {
      // Guard against callbacks after cleanup
      if (!active) return

      if (status === 'SUBSCRIBED') {
        updateStatus('connected')
      } else if (status === 'CHANNEL_ERROR') {
        logger.error(`[Realtime] Channel error for "${channelName}":`, status)
        updateStatus('errored')
      } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
        updateStatus('disconnected')
      }
      // Note: Supabase also has 'JOINED' status, but we treat SUBSCRIBED as connected
    })

    // Cleanup function - React guarantees this runs before the next effect
    return () => {
      active = false

      if (debugLabelRef.current) {
        logger.debug(
          `[Realtime:${debugLabelRef.current}] Cleaning up channel: ${channelName}`
        )
      }
      supabase.removeChannel(newChannel)
      // Don't set state here - let the next effect run set the new channel/status
      // This avoids flicker and prevents callbacks during teardown
    }
  }, [channelName, supabase, channelConfig])

  return { channel, status }
}

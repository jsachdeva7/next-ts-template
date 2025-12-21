import { live } from '@/lib/realtime/channels'
import { createSupabaseServerClient } from '@/server/db/supabase/server'

/**
 * Broadcasts a message to a live channel using the user's session from cookies.
 *
 * Automatically reads the user's session from cookies (via createSupabaseServerClient),
 * matching how the browser client works. All broadcasts are tied to the authenticated
 * user's session.
 *
 * @param domain - The resource domain (e.g., 'doc', 'comment')
 * @param resourceId - The resource identifier
 * @param event - The event name (e.g., 'delta', 'snapshot')
 * @param payload - The payload to broadcast
 */
export async function broadcastLive(
  domain: string,
  resourceId: string,
  event: string,
  payload: unknown
): Promise<void> {
  const channelName = live(domain, resourceId)

  // Use createServerClient which automatically reads cookies (like browser client)
  // This ensures the Realtime WebSocket uses the user's session automatically
  const supabase = await createSupabaseServerClient()

  // Verify user is authenticated using the same client instance
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const channel = supabase.channel(channelName, {
    config: { private: true }
  })

  try {
    // Subscribe to the channel
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout subscribing to channel: ${channelName}`))
      }, 5000)

      channel.subscribe((status, error) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout)
          resolve()
        } else if (status === 'CHANNEL_ERROR') {
          clearTimeout(timeout)
          const errorMessage = error
            ? error instanceof Error
              ? error.message
              : String(error)
            : 'Unknown channel error'
          reject(new Error(`Channel error: ${channelName} - ${errorMessage}`))
        }
      })
    })

    // Send broadcast
    const result = await channel.send({
      type: 'broadcast',
      event,
      payload
    })

    if (result === 'error') {
      throw new Error(`Failed to broadcast ${event} to ${channelName}`)
    }
  } finally {
    // Clean up
    await supabase.removeChannel(channel)
  }
}

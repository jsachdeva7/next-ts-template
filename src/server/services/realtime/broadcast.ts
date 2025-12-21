import { env } from '@/lib/env'
import { live } from '@/lib/realtime/channels'
import { createClient } from '@supabase/supabase-js'

/**
 * Broadcasts a message to a live channel using the service role key.
 *
 * This utility allows server-side code to broadcast to private Realtime channels
 * without requiring client authentication.
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
  const supabaseUrl = env.client.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = env.server.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for broadcasting')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const channelName = live(domain, resourceId)
  const channel = supabase.channel(channelName, {
    config: { private: true }
  })

  // Subscribe to the channel
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout subscribing to channel: ${channelName}`))
    }, 5000)

    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timeout)
        resolve()
      } else if (status === 'CHANNEL_ERROR') {
        clearTimeout(timeout)
        reject(new Error(`Channel error: ${channelName}`))
      }
    })
  })

  // Send broadcast
  const result = await channel.send({
    type: 'broadcast',
    event,
    payload
  })

  // Clean up
  await supabase.removeChannel(channel)

  if (result === 'error') {
    throw new Error(`Failed to broadcast ${event} to ${channelName}`)
  }
}

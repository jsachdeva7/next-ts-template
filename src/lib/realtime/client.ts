import { createSupabaseBrowserClient } from '@/server/db/supabase/browser'

/**
 * Single entry point for getting a Supabase client for realtime operations.
 *
 * Use this in client components and hooks that need realtime functionality.
 * This ensures all realtime code uses the same client instance with consistent auth context.
 */
export function createRealtimeClient() {
  return createSupabaseBrowserClient()
}

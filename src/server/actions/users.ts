'use server'

import { getUser } from '@/server/auth/supabase'

/**
 * Server action wrapper for getting the current user.
 *
 * Use this in client components that need to check authentication status
 * or display user information.
 *
 * Returns null if the user is not authenticated.
 * For server components, use getUser() directly from server/auth/supabase.
 */
export async function getUserAction() {
  return getUser()
}

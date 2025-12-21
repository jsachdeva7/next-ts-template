'use server'

import { getCurrentUserProfile } from '@/server/queries/profiles'

/**
 * Server action wrapper for getting the current user's profile.
 *
 * Use this in client components that need to fetch the user profile.
 * For server components, use getCurrentUserProfile() directly from queries.
 */
export async function getCurrentUserProfileAction() {
  return getCurrentUserProfile()
}

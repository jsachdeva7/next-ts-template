import { assert } from '@/lib/utils'
import { createSupabaseBrowserClient } from '@/server/db/supabase/browser'
import type { AuthClient, AuthResult } from '../client'

export const supabaseAuthClient: AuthClient = {
  async signInWithPassword(
    email: string,
    password: string
  ): Promise<AuthResult> {
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password
      })

      if (error) {
        return { ok: false, message: error.message }
      }

      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred. Please try again.'
      }
    }
  },

  async signUp(
    email: string,
    password: string,
    data: Record<string, string>
  ): Promise<AuthResult> {
    try {
      assert(
        data.first_name && data.last_name,
        'First and last name are required'
      )
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          data: { first_name: data.first_name, last_name: data.last_name } // becomes raw_user_meta_data
        }
      })

      if (error) {
        return { ok: false, message: error.message }
      }

      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred. Please try again.'
      }
    }
  },

  async signOut(): Promise<void> {
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
  }
}

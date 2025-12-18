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

  async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.signUp({
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

  async signOut(): Promise<void> {
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
  }
}

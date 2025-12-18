/**
 * Public API for client-side authentication actions (sign-in/sign-out).
 * Server gating still lives in src/server/auth/* (getUser, requireUser).
 *
 * This is the single wiring point: to swap auth providers, change the import/export here.
 */

export type AuthResult = { ok: true } | { ok: false; message: string }

export interface AuthClient {
  signInWithPassword(email: string, password: string): Promise<AuthResult>
  signUp(email: string, password: string): Promise<AuthResult>
  signOut(): Promise<void>
}

export { supabaseAuthClient as authClient } from './providers/supabase.client'

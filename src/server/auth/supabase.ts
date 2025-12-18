import { createSupabaseServerClient } from '@/server/db/supabase/server'
import { redirect } from 'next/navigation'

export async function getUser() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function requireUser() {
  const user = await getUser()
  if (!user) redirect('/sign-in')
  return user
}

import { requireUser } from '@/server/auth/supabase'
import { createSupabaseServerClient } from '@/server/db/supabase/server'

export async function getCurrentUserProfile() {
  const user = await requireUser()
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}

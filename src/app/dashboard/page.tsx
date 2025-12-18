import Dashboard from '@/features/dashboard/Dashboard'
import { requireUser } from '@/server/auth/supabase'

export default async function DashboardPage() {
  await requireUser() // Gate the page - redirects to /sign-in if not authenticated

  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-8'>
      <Dashboard />
    </main>
  )
}

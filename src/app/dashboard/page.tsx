import SignOut from '@/features/auth/SignOut'
import { requireUser } from '@/server/auth/supabase'

export default async function DashboardPage() {
  const user = await requireUser()

  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-8'>
      <h1 className='text-4xl font-bold'>Welcome {user.email}</h1>
      <SignOut />
    </main>
  )
}

import ExampleQuery from '@/features/example/components/ExampleQuery'
import { requireUser } from '@/server/auth/supabase'

export default async function DashboardPage() {
  const user = await requireUser()

  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-4'>
      <h1 className='text-4xl font-bold'>Welcome {user.email}</h1>
      <ExampleQuery />
    </main>
  )
}

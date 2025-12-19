import NavigationButtons from '@/features/landing/components/NavigationButtons'
import { getUser } from '@/server/auth/supabase'
import { redirect } from 'next/navigation'

export default async function Home() {
  const user = await getUser()
  if (user) redirect('/dashboard')

  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-8'>
      <h1 className='text-4xl font-medium'>
        Next TS <span className='font-bold text-green-600'>Supabase</span>{' '}
        Template Landing
      </h1>
      <NavigationButtons />
    </main>
  )
}

import SignIn from '@/features/auth/SignIn'
import { getUser } from '@/server/auth/supabase'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const user = await getUser()
  if (user) redirect('/')

  return (
    <div className='rounded-xl border bg-white p-6 shadow-sm'>
      <h1 className='text-2xl font-semibold'>Login</h1>
      <p className='mt-1 text-sm text-neutral-600'>
        Sign in with your Supabase email + password.
      </p>

      <div className='mt-6'>
        <SignIn />
      </div>
    </div>
  )
}

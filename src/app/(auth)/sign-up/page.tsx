import SignUp from '@/features/auth/SignUp'
import { getUser } from '@/server/auth/supabase'
import { redirect } from 'next/navigation'

export default async function SignUpPage() {
  const user = await getUser()
  if (user) redirect('/')

  return (
    <div className='rounded-xl border bg-white p-6 shadow-sm'>
      <h1 className='text-2xl font-semibold'>Sign up</h1>
      <p className='mt-1 text-sm text-neutral-600'>
        Create an account with your email and password.
      </p>

      <div className='mt-6'>
        <SignUp />
      </div>
    </div>
  )
}

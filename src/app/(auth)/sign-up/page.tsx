import SignUp from '@/features/auth/SignUp'
import { getUser } from '@/server/auth/supabase'
import { redirect } from 'next/navigation'

export default async function SignUpPage() {
  const user = await getUser()
  if (user) redirect('/')

  return (
    <div className='rounded-xl border bg-white p-6 shadow-sm'>
      <SignUp />
    </div>
  )
}

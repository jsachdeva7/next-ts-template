import SignOut from '@/features/auth/SignOut'
import { getCurrentUserProfile } from '@/server/queries/profiles'
import ToastButton from './ToastButton'

export default async function Dashboard() {
  const profile = await getCurrentUserProfile()

  return (
    <>
      <h1 className='text-4xl font-medium'>
        Welcome,{' '}
        <span className='font-bold'>
          {profile.first_name} {profile.last_name}
        </span>
        .
      </h1>
      <div className='flex gap-4'>
        <SignOut />
        <ToastButton />
      </div>
    </>
  )
}

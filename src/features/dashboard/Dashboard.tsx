import SignOut from '@/features/auth/SignOut'
import { getCurrentUserProfile } from '@/server/queries/profiles'

export default async function Dashboard() {
  const profile = await getCurrentUserProfile()

  return (
    <>
      <h1 className='text-4xl font-medium'>
        Welcome,{' '}
        <span className='font-bold'>
          {profile.first_name} {profile.last_name}
        </span>
      </h1>
      <SignOut />
    </>
  )
}

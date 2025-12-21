import SignOut from '@/features/auth/SignOut'
import { getCurrentUserProfile } from '@/server/queries/profiles'
import LiveDoc from './LiveDoc'
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
      <div className='mt-4 flex w-full max-w-2xl flex-col items-center justify-center gap-4'>
        <p className='text-center text-neutral-500'>
          Open{' '}
          <a
            href='/dashboard'
            className='font-medium text-black underline underline-offset-2 hover:text-neutral-700'
            target='_blank'
          >
            this page
          </a>{' '}
          in another tab to see changes to your document in real-time.
        </p>
        <LiveDoc />
      </div>
    </>
  )
}

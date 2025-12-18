'use client'

import { authClient } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'

export default function SignOut() {
  const router = useRouter()

  async function handleSignOut() {
    try {
      await authClient.signOut()
      router.replace('/')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      className='rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800'
    >
      Sign out
    </button>
  )
}

'use client'

import Button from '@/ui/Button'
import { useRouter } from 'next/navigation'

export default function NavigationButtons() {
  const router = useRouter()

  return (
    <div className='flex gap-4'>
      <Button onClick={() => router.push('/sign-in')}>Sign in</Button>
      <Button variant='secondary' onClick={() => router.push('/sign-up')}>
        Sign up
      </Button>
    </div>
  )
}

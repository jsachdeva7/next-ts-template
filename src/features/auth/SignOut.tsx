'use client'

import { authClient } from '@/lib/auth/client'
import { Button } from '@/ui/Button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignOut() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    try {
      await authClient.signOut()
      router.replace('/')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleSignOut} loading={loading}>
      Sign out
    </Button>
  )
}

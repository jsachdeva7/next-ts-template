'use client'

import { authClient } from '@/lib/auth/client'
import { showToast } from '@/lib/toast'
import Button from '@/ui/Button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignIn() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const result = await authClient.signInWithPassword(email, password)
      if (!result.ok) {
        setError(result.message)
        showToast('error', { message: result.message })
        return
      }

      showToast('success', { message: 'Signed in successfully' })
      router.replace('/dashboard')
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className='space-y-4' suppressHydrationWarning>
      <div className='space-y-1'>
        <label className='text-sm font-medium' htmlFor='email'>
          Email
        </label>
        <input
          id='email'
          type='email'
          autoComplete='email'
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className='w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20'
          placeholder='you@example.com'
        />
      </div>

      <div className='space-y-1'>
        <label className='text-sm font-medium' htmlFor='password'>
          Password
        </label>
        <input
          id='password'
          type='password'
          autoComplete='current-password'
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className='w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20'
          placeholder='••••••••'
        />
      </div>

      {error ? (
        <div className='rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
          {error}
        </div>
      ) : null}

      <Button type='submit' loading={submitting} className='w-full'>
        Sign in
      </Button>

      <p className='text-center text-sm text-neutral-600'>
        Don't have an account?{' '}
        <a
          href='/sign-up'
          className='font-medium text-black underline underline-offset-2 hover:text-neutral-700'
        >
          Sign up
        </a>
      </p>
    </form>
  )
}

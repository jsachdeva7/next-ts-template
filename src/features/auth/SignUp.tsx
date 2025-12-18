'use client'

import { authClient } from '@/lib/auth/client'
import Button from '@/ui/Button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignUp() {
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)

    try {
      const result = await authClient.signUp(email, password, {
        first_name: firstName,
        last_name: lastName
      })
      if (!result.ok) {
        setError(result.message)
        return
      }

      router.replace('/sign-in')
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className='space-y-4' suppressHydrationWarning>
      <div className='flex gap-4'>
        <div className='flex-1 space-y-1'>
          <label className='text-sm font-medium' htmlFor='first-name'>
            First Name
          </label>
          <input
            id='first-name'
            type='text'
            autoComplete='given-name'
            required
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            className='w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20'
            placeholder='John'
          />
        </div>
        <div className='flex-1 space-y-1'>
          <label className='text-sm font-medium' htmlFor='last-name'>
            Last Name
          </label>
          <input
            id='last-name'
            type='text'
            autoComplete='family-name'
            required
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            className='w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20'
            placeholder='Doe'
          />
        </div>
      </div>

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
          autoComplete='new-password'
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className='w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20'
          placeholder='••••••••'
        />
      </div>

      <div className='space-y-1'>
        <label className='text-sm font-medium' htmlFor='confirm-password'>
          Confirm Password
        </label>
        <input
          id='confirm-password'
          type='password'
          autoComplete='new-password'
          required
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
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
        Sign up
      </Button>

      <p className='text-center text-sm text-neutral-600'>
        Already have an account?{' '}
        <a
          href='/sign-in'
          className='font-medium text-black underline underline-offset-2 hover:text-neutral-700'
        >
          Sign in
        </a>
      </p>
    </form>
  )
}

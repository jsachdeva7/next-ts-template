import type { ReactNode } from 'react'

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <main className='flex min-h-dvh items-center justify-center p-6'>
      <div className='w-full max-w-md'>{children}</div>
    </main>
  )
}

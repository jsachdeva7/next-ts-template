export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-8'>
      <h1 className='text-4xl font-medium'>
        Next TS <span className='font-bold text-green-600'>Supabase</span>{' '}
        Template Landing
      </h1>
      <div className='flex gap-4'>
        <a
          href='/sign-in'
          className='rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800'
        >
          Sign in
        </a>
        <a
          href='/sign-up'
          className='rounded-md bg-neutral-200 px-4 py-2 text-sm font-medium text-black hover:bg-neutral-300'
        >
          Sign up
        </a>
      </div>
    </main>
  )
}

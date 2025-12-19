import NavigationButtons from '@/features/landing/components/NavigationButtons'

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-8'>
      <h1 className='text-4xl font-medium'>
        Next TS <span className='font-bold text-green-600'>Supabase</span>{' '}
        Template Landing
      </h1>
      <NavigationButtons />
    </main>
  )
}

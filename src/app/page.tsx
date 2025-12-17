import ExampleQuery from '@/features/example/components/ExampleQuery'

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-4'>
      <h1 className='text-4xl font-bold'>Next TS Template</h1>
      <ExampleQuery />
    </main>
  )
}

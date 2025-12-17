'use client'

import { useVersionQuery } from './api'

export default function ExampleQuery() {
  const { data, isLoading, error } = useVersionQuery()

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed: {(error as Error).message}</p>

  return (
    <pre className='text-sm opacity-80'>{JSON.stringify(data, null, 2)}</pre>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'

async function getVersion(): Promise<{ version?: string } | string> {
  const res = await fetch('/api/version')
  if (!res.ok) throw new Error('Failed to fetch /api/version')
  return res.json()
}

export default function ExampleQuery() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['version'],
    queryFn: getVersion,
    staleTime: 60_000
  })

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Failed: {(error as Error).message}</p>

  return (
    <pre className='text-sm opacity-80'>
      {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
    </pre>
  )
}

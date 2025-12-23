'use client'

import { setupConsoleFilter } from '@/lib/console-filter'
import { Toaster } from '@/ui/Sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useEffect, useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient())

  useEffect(() => {
    setupConsoleFilter()
  }, [])

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster position='bottom-center' />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

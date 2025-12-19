'use client'

import { setupConsoleFilter } from '@/lib/console-filter'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useEffect, useState } from 'react'
import { ToastContainer } from 'react-toastify'

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient())

  useEffect(() => {
    setupConsoleFilter()
  }, [])

  return (
    <QueryClientProvider client={client}>
      {children}
      <ToastContainer
        hideProgressBar
        closeOnClick
        newestOnTop
        position='bottom-center'
        autoClose={false}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

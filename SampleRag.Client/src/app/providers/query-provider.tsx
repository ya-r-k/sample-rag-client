import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry(failureCount, error: unknown) {
        const status =
          typeof error === 'object' && error !== null && 'status' in error
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (error as any).status
            : undefined

        if (status === 401 || status === 403) {
          return false
        }

        return failureCount < 3
      },
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
})

type QueryProviderProps = {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}


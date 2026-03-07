import { AppRouter } from './router'
import { QueryProvider } from './providers/query-provider'

export function App() {
  return (
    <QueryProvider>
      <AppRouter />
    </QueryProvider>
  )
}


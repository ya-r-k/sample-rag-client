import type { ReactNode } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { cn } from '../shared/lib/cn'

type AppLayoutProps = {
  children?: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-muted px-6 py-3">
        <nav className="flex items-center gap-6" aria-label="Main">
          <Link
            to="/"
            className={cn(
              'text-sm font-semibold tracking-wide transition-colors hover:text-foreground/90',
              location.pathname === '/' ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            RAG Chat
          </Link>
          <Link
            to="/chats"
            className={cn(
              'text-sm font-medium transition-colors hover:text-foreground',
              location.pathname.startsWith('/chats') ? 'text-foreground underline' : 'text-muted-foreground',
            )}
          >
            Chats
          </Link>
        </nav>
      </header>
      <main className="flex min-h-0 flex-1 flex-col px-6 py-4">
        {children ?? <Outlet />}
      </main>
      <footer className="border-t border-muted px-6 py-3 text-xs text-muted-foreground">
        © {new Date().getFullYear()} RAG Chat
      </footer>
    </div>
  )
}


import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'

type AppLayoutProps = {
  children?: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-muted px-6 py-3">
        <div className="text-sm font-semibold tracking-wide">RAG Chat</div>
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


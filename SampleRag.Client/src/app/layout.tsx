import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '../widgets/header/ui/header'
import { Footer } from '../widgets/footer/ui/footer'

type AppLayoutProps = {
  children?: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex min-h-0 flex-1 flex-col px-6 py-4">
        {children ?? <Outlet />}
      </main>
      <Footer />
    </div>
  )
}


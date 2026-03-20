import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { AppLayout } from './layout'
import { MainPage } from '../pages/main/ui/main-page'
import { ChatPage } from '../pages/chat/ui/chat-page'
import { ChatsIndexGate } from '../pages/chat/ui/chats-index-gate'
import { DocumentsPage } from '../pages/documents/ui/documents-page'
import { ScopesPage } from '../pages/scopes/ui/scopes-page'
import { Footer } from '../widgets/footer/ui/footer'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <PageTransition>
        <AppLayout>
          <MainPage />
        </AppLayout>
      </PageTransition>
    ),
  },
  {
    path: '/chat',
    element: <Navigate to="/chats" replace />,
  },
  {
    path: '/chats',
    element: (
      <PageTransition>
        <div className="grid h-screen grid-cols-[280px_1fr] grid-rows-[1fr_auto] gap-x-0 gap-y-0">
          <ChatsIndexGate />
          <Footer className="col-start-2 col-end-3 row-start-2 row-end-3" />
        </div>
      </PageTransition>
    ),
  },
  {
    path: '/chats/:chatId',
    element: (
      <PageTransition>
        <div className="grid h-screen grid-cols-[280px_1fr] grid-rows-[1fr_auto] gap-x-0 gap-y-0">
          <ChatPage />
          <Footer className="col-start-2 col-end-3 row-start-2 row-end-3" />
        </div>
      </PageTransition>
    ),
  },
  {
    path: '/documents',
    element: (
      <PageTransition>
        <AppLayout>
          <DocumentsPage isAdmin />
        </AppLayout>
      </PageTransition>
    ),
  },
  {
    path: '/scopes',
    element: (
      <PageTransition>
        <AppLayout>
          <ScopesPage isAdmin />
        </AppLayout>
      </PageTransition>
    ),
  },
])

type PageTransitionProps = {
  children: ReactNode
}

function PageTransition({ children }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export function AppRouter() {
  return <RouterProvider router={router} />
}


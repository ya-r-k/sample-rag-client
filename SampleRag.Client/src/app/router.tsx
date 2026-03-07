import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { AppLayout } from './layout'
import { PlaceholderPage } from './placeholder'
import { ChatPage } from '../pages/chat/ui/chat-page'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <PageTransition>
        <AppLayout>
          <PlaceholderPage />
        </AppLayout>
      </PageTransition>
    ),
  },
  {
    path: '/chat',
    element: (
      <PageTransition>
        <AppLayout>
          <ChatPage />
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


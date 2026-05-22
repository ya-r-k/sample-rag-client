import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/cn'

type ScrollAreaProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function ScrollArea({ children, className, ...props }: ScrollAreaProps) {
  return (
    <div
      className={cn(
        'overflow-y-auto h-full scrollbar-thin scrollbar-track-muted scrollbar-thumb-sky-700',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}


import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
}

export function Button({ children, className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}


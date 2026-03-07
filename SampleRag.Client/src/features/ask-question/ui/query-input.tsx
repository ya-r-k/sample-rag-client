import { useState, useCallback } from 'react'
import { Button } from '../../../shared/ui/button'
import { Input } from '../../../shared/ui/input'
import { cn } from '../../../shared/lib/cn'

type QueryInputProps = {
  onSubmit: (text: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function QueryInput({
  onSubmit,
  disabled = false,
  placeholder = 'Ask a question...',
  className,
}: QueryInputProps) {
  const [value, setValue] = useState('')

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = value.trim()
      if (trimmed && !disabled) {
        onSubmit(trimmed)
        setValue('')
      }
    },
    [value, disabled, onSubmit],
  )

  return (
    <form onSubmit={handleSubmit} className={cn('flex gap-2', className)}>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="min-w-0 flex-1"
        aria-label="Question input"
      />
      <Button type="submit" disabled={disabled || !value.trim()}>
        Send
      </Button>
    </form>
  )
}

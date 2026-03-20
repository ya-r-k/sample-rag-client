import { useState, FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addChatOwners } from '../../../shared/api/chats'
import { cn } from '../../../shared/lib/cn'

type ShareChatFormProps = {
  chatId: string
  className?: string
}

/**
 * Minimal share-chat form: user enters identifier (userId/username/email),
 * client sends it as userId to POST /api/chats/{id}/owners.
 */
export function ShareChatForm({ chatId, className }: ShareChatFormProps) {
  const queryClient = useQueryClient()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (identifier: string) =>
      addChatOwners(chatId, {
        userId: identifier,
      }),
    onSuccess: () => {
      setValue('')
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to share chat'
      setError(message)
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!value.trim() || mutation.isPending) return
    mutation.mutate(value.trim())
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-2', className)}
      aria-label="Share chat"
    >
      <label className="text-xs font-medium text-muted-foreground">
        Share with user (ID, username, or email)
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          placeholder="Enter identifier"
          disabled={mutation.isPending}
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
          disabled={mutation.isPending || !value.trim()}
        >
          {mutation.isPending ? 'Sharing…' : 'Share'}
        </button>
      </div>
      {error && (
        <p className="text-xs text-destructive" role="status">
          {error}
        </p>
      )}
    </form>
  )
}


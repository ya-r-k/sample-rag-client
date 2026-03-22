import { FormEvent, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createScope } from '../../../shared/api/scopes'
import { cn } from '../../../shared/lib/cn'
import { useTranslation } from 'react-i18next'

type CreateScopeFormProps = {
  className?: string
}

export function CreateScopeForm({ className }: CreateScopeFormProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: createScope,
    onSuccess: () => {
      setName('')
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : t('createScope.failed')
      setError(message)
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const value = name.trim()
    if (!value || mutation.isPending) return
    mutation.mutate({ name: value })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-2', className)}
      aria-label={t('createScope.ariaLabel')}
    >
      <label className="text-xs font-medium text-muted-foreground" htmlFor="scope-name">
        {t('createScope.label')}
      </label>
      <input
        id="scope-name"
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        placeholder={t('createScope.placeholder')}
        disabled={mutation.isPending}
      />
      <button
        type="submit"
        disabled={mutation.isPending || !name.trim()}
        className="inline-flex items-center justify-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
      >
        {mutation.isPending ? t('createScope.creating') : t('createScope.create')}
      </button>
      {error && (
        <p className="text-xs text-destructive" role="status">
          {error}
        </p>
      )}
    </form>
  )
}


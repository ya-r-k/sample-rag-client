import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getGroups, createScope } from '../../../shared/api/scopes'
import { cn } from '../../../shared/lib/cn'

type ScopesPageProps = {
  isAdmin?: boolean
}

export function ScopesPage({ isAdmin = false }: ScopesPageProps) {
  const [offset, setOffset] = useState(0)
  const [newName, setNewName] = useState('')
  const queryClient = useQueryClient()

  const { data: scopes = [] } = useQuery({
    queryKey: ['groups', { limit: 10, offset }],
    queryFn: () => getGroups({ limit: 10, offset }),
  })

  const hasNextPage = scopes.length === 10
  const hasPrevPage = offset > 0

  const createMutation = useMutation({
    mutationFn: createScope,
    onSuccess: () => {
      setNewName('')
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })

  if (!isAdmin) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-4">
        <div className="max-w-md rounded-lg border border-muted bg-background p-6 text-center text-sm text-muted-foreground">
          <p>This page is available to admins only.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 px-6 py-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Knowledge scopes</h1>
        <p className="text-sm text-muted-foreground">
          View and manage scopes used for grouping documents.
        </p>
      </header>

      <section className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {scopes.map((scope) => (
            <div
              key={scope.id}
              className="flex flex-col justify-between rounded-lg border border-muted bg-background p-4 text-sm"
            >
              <div>
                <p className="font-semibold text-foreground">{scope.name}</p>
                <p className="mt-1 text-xs text-muted-foreground truncate" title={scope.id}>
                  {scope.id}
                </p>
              </div>
            </div>
          ))}

          <div className="flex flex-col justify-between rounded-lg border border-dashed border-muted bg-muted/30 p-4 text-sm">
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Add new scope</p>
              <p className="text-xs text-muted-foreground">
                Enter a name and save to create a new scope.
              </p>
            </div>
            <form
              className="mt-3 space-y-2"
              onSubmit={(event) => {
                event.preventDefault()
                const value = newName.trim()
                if (!value || createMutation.isPending) return
                createMutation.mutate({ name: value })
              }}
            >
              <input
                type="text"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                placeholder="Scope name"
                disabled={createMutation.isPending}
              />
              <button
                type="submit"
                disabled={createMutation.isPending || !newName.trim()}
                className={cn(
                  'inline-flex items-center justify-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60',
                )}
              >
                {createMutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </form>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setOffset((prev) => Math.max(prev - 10, 0))}
            disabled={!hasPrevPage}
            className="rounded-md border border-muted bg-background px-3 py-1 text-xs text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setOffset((prev) => prev + 10)}
            disabled={!hasNextPage}
            className="rounded-md border border-muted bg-background px-3 py-1 text-xs text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </section>
    </div>
  )
}


import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getScopes, createScope } from '../../../shared/api/scopes'
import { cn } from '../../../shared/lib/cn'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../shared/ui/button'

type ScopesPageProps = {
  isAdmin?: boolean
}

export function ScopesPage({ isAdmin = false }: ScopesPageProps) {
  const { t } = useTranslation()
  const [lastId, setLastId] = useState(undefined as string | undefined)
  const [newName, setNewName] = useState('')
  const queryClient = useQueryClient()

  const { data: scopes = [] } = useQuery({
    queryKey: ['groups', { batchSize: 10, lastId }],
    queryFn: () => getScopes({ batchSize: 10, lastId }),
  })

  const hasNextPage = scopes.length === 10

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
          <p>{t('scopesPage.noAccess')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 px-6 py-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">{t('scopesPage.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('scopesPage.subtitle')}
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
              <p className="font-semibold text-foreground">{t('scopesPage.addNewTitle')}</p>
              <p className="text-xs text-muted-foreground">
                {t('scopesPage.addNewDescription')}
              </p>
            </div>
            <form
              className="mt-3 space-y-2"
              onSubmit={(event) => {
                event.preventDefault()
                const value = newName.trim()
                if (!value || createMutation.isPending) return
                createMutation.mutate([{ name: value }])
              }}
            >
              <input
                type="text"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                placeholder={t('scopesPage.scopeNamePlaceholder')}
                disabled={createMutation.isPending}
              />
              <Button
                type="submit"
                disabled={createMutation.isPending || !newName.trim()}
                className={cn(
                  'inline-flex items-center justify-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60',
                )}
              >
                {createMutation.isPending ? t('scopesPage.saving') : t('scopesPage.save')}
              </Button>
            </form>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            onClick={() => setLastId(scopes[scopes.length - 1].id)}
            disabled={!hasNextPage}
            className="rounded-md border border-muted bg-background px-3 py-1 text-xs text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('scopesPage.more')}
          </Button>
        </div>
      </section>
    </div>
  )
}

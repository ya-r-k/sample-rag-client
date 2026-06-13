import { cn } from '../../../shared/lib/cn'
import { Button } from '../../../shared/ui/button'
import { useScopesPage } from './scopes-page.hook'
import { ScopesPageDeleteModal } from './scopes-page-delete-modal'

type ScopesPageProps = {
  isAdmin?: boolean
}

export function ScopesPage({ isAdmin = false }: ScopesPageProps) {
  const {
    t,
    scopes,
    scopeToDelete,
    setScopeToDelete,
    newName,
    setNewName,
    createMutation,
    deleteMutation,
    hasNextPage,
    handleCreateSubmit,
    handleLoadMore,
    isCreateDisabled,
  } = useScopesPage(isAdmin)

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
              <div className="mt-4 flex items-center justify-end">
                <Button
                  type="button"
                  onClick={() => setScopeToDelete(scope)}
                  className="rounded-md border border-destructive bg-red-600 px-2 py-1 text-[11px] font-medium text-destructive-foreground hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {t('scopesPage.delete')}
                </Button>
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
              onSubmit={handleCreateSubmit}
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
                disabled={isCreateDisabled}
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
            onClick={handleLoadMore}
            disabled={!hasNextPage}
            className="rounded-md border border-muted bg-background px-3 py-1 text-xs text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('scopesPage.more')}
          </Button>
        </div>
      </section>

      {scopeToDelete && (
        <ScopesPageDeleteModal
          scopeToDelete={scopeToDelete}
          isDeleting={deleteMutation.isPending}
          onClose={() => setScopeToDelete(null)}
          onConfirm={() => deleteMutation.mutate(scopeToDelete.id)}
        />
      )}
    </div>
  )
}

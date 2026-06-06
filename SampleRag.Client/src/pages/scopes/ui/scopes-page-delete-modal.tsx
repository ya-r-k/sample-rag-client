import { Button } from '../../../shared/ui/button'
import { useTranslation } from 'react-i18next'
import type { ScopeDto } from '../../../shared/api/scopes'

type ScopesPageDeleteModalProps = {
  scopeToDelete: ScopeDto
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ScopesPageDeleteModal({
  scopeToDelete,
  isDeleting,
  onClose,
  onConfirm,
}: ScopesPageDeleteModalProps) {
  const { t } = useTranslation()

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-lg border border-muted bg-background p-5 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {t('scopesPage.deleteModalTitle')}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('scopesPage.deleteModalDescription', { name: scopeToDelete.name })}
            </p>
          </div>
          <Button
            type="button"
            onClick={onClose}
            className="rounded-md border border-muted bg-background px-2 py-1 text-xs text-foreground hover:bg-muted"
          >
            {t('scopesPage.close')}
          </Button>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            type="button"
            onClick={onClose}
            className="rounded-md border border-muted bg-background px-3 py-1 text-xs text-foreground hover:bg-muted"
          >
            {t('scopesPage.cancel')}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-md border border-destructive bg-red-600 px-3 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? t('scopesPage.deleting') : t('scopesPage.delete')}
          </Button>
        </div>
      </div>
    </div>
  )
}

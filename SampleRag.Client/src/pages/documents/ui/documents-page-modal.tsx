import { DocumentForm, type DocumentFormValues } from '../../../features/upload-document/ui/document-form'
import { Button } from '../../../shared/ui/button'
import { useTranslation } from 'react-i18next'
import type { DocumentDto } from '../../../shared/api/documents'

type DocumentsPageModalProps = {
  modalMode: 'create' | 'edit'
  editingDocument: DocumentDto | null
  isCreateSubmitting: boolean
  isEditSubmitting: boolean
  onClose: () => void
  onCreateSubmit: (values: DocumentFormValues) => void
  onEditSubmit: (values: DocumentFormValues) => void
}

export function DocumentsPageModal({
  modalMode,
  editingDocument,
  isCreateSubmitting,
  isEditSubmitting,
  onClose,
  onCreateSubmit,
  onEditSubmit,
}: DocumentsPageModalProps) {
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
              {modalMode === 'create' ? t('documentsPage.modalTitle') : t('documentsPage.editModalTitle')}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {modalMode === 'create'
                ? t('documentsPage.modalDescription')
                : t('documentsPage.editModalDescription')}
            </p>
          </div>
          <Button
            type="button"
            onClick={onClose}
            className="rounded-md border border-muted bg-background px-2 py-1 text-xs text-foreground hover:bg-muted"
          >
            {t('documentsPage.close')}
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {modalMode === 'create' ? (
            <DocumentForm
              showFileField={true}
              requireFile={true}
              requireScope={true}
              isSubmitting={isCreateSubmitting}
              submitLabel={t('documentsPage.uploadDocument')}
              submitPendingLabel={t('documentUpload.uploading')}
              onSubmit={onCreateSubmit}
            />
          ) : (
            <DocumentForm
              initialName={editingDocument?.name ?? ''}
              initialScopeId={editingDocument?.scopeId ?? null}
              showFileField={false}
              requireFile={false}
              requireScope={true}
              isSubmitting={isEditSubmitting}
              submitLabel={t('documentsPage.saveChanges')}
              submitPendingLabel={t('documentsPage.savingChanges')}
              onSubmit={onEditSubmit}
            />
          )}
        </div>
      </div>
    </div>
  )
}

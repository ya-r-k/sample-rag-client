import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getScopes } from '../../../shared/api/scopes'
import { listDocuments, deleteDocument, uploadDocument, type DocumentDto } from '../../../shared/api/documents'
import { DocumentForm } from '../../../features/upload-document/ui/document-form'
import { Button } from '../../../shared/ui/button'
import { useTranslation } from 'react-i18next'

type DocumentsPageProps = {
  isAdmin?: boolean
}

/**
 * Documents admin page — create scopes and upload PDFs.
 * Note: API has no GET /documents; list is left as a simple placeholder.
 */
export function DocumentsPage({ isAdmin = false }: DocumentsPageProps) {
  const { t } = useTranslation()
  const [lastId, setLastId] = useState<string | undefined>(undefined)
  const batchSize = 10
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingDocument, setEditingDocument] = useState<DocumentDto | null>(null)

  const queryClient = useQueryClient()

  const { data: scopes = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => getScopes(),
  })

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', { lastId, batchSize }],
    queryFn: () => listDocuments({ lastId, batchSize }),
  })

  const hasNextPage = documents.length === batchSize

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; scopeId: string; file: File }) =>
      uploadDocument(payload),
    onSuccess: () => {
      setModalMode(null)
      setEditingDocument(null)
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  const editMutation = useMutation({
    mutationFn: async (payload: { id: string; name: string; scopeId: string }) => payload,
    onSuccess: ({ id, name, scopeId }) => {
      queryClient.setQueriesData<DocumentDto[]>({ queryKey: ['documents'] }, (prev) =>
        (prev ?? []).map((doc) => (doc.id === id ? { ...doc, name, scopeId } : doc)),
      )
      setModalMode(null)
      setEditingDocument(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  const scopeItems = useMemo(
    () =>
      scopes.map((scope) => ({
        id: scope.id,
        name: scope.name,
      })),
    [scopes],
  )

  if (!isAdmin) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-4">
        <div className="max-w-md rounded-lg border border-muted bg-background p-6 text-center text-sm text-muted-foreground">
          <p>{t('documentsPage.noAccess')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">{t('documentsPage.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('documentsPage.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingDocument(null)
            setModalMode('create')
          }}
          className="bg-sky-600 px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {t('documentsPage.uploadDocument')}
        </Button>
      </div>

      <section>
        <div className="space-y-4 rounded-lg py-4">
          <h2 className="text-sm font-semibold text-foreground">{t('documentsPage.listTitle')}</h2>
          <p className="text-xs text-muted-foreground">
            {t('documentsPage.listDescription')}
          </p>
          <div className="mt-3 space-y-2">
            {documents.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('documentsPage.empty')}</p>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-muted bg-muted/30 px-3 py-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground" title={doc.name}>
                        {doc.name}
                      </p>
                      {doc.localLink && (
                        <a
                          href={`/documents/view?path=${encodeURIComponent(doc.localLink)}&name=${encodeURIComponent(doc.name)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 inline-flex text-[11px] text-sky-600 underline hover:text-sky-700"
                        >
                          {t('documentsPage.viewLocal')}
                        </a>
                      )}
                      {doc.originalLink && (
                        <a
                          href={doc.originalLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 inline-flex text-[11px] text-sky-600 underline hover:text-sky-700"
                        >
                          {t('documentsPage.viewOriginal')}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        onClick={() => {
                          setEditingDocument(doc)
                          setModalMode('edit')
                        }}
                        className="rounded-md border border-destructive bg-destructive px-2 py-1 text-[11px] font-medium text-destructive-foreground hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        {t('documentsPage.edit')}
                      </Button>
                      <Button
                        onClick={() => {
                          const confirmed = window.confirm(t('documentsPage.deleteConfirm', { name: doc.name }))
                          if (!confirmed) return
                          deleteMutation.mutate(doc.id)
                        }}
                        className="rounded-md border border-destructive bg-red-600 px-2 py-1 text-[11px] font-medium text-destructive-foreground hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        {t('documentsPage.delete')}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            {hasNextPage && <Button
                onClick={() => setLastId(documents[documents.length - 1].id)}
                className="rounded-md border border-muted bg-background px-3 py-1 text-xs text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('documentsPage.moreDocuments')}
              </Button>}
          </div>
        </div>
      </section>

      {modalMode && (
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
                onClick={() => {
                  setModalMode(null)
                  setEditingDocument(null)
                }}
                className="rounded-md border border-muted bg-background px-2 py-1 text-xs text-foreground hover:bg-muted"
              >
                {t('documentsPage.close')}
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {modalMode === 'create' ? (
                <DocumentForm
                  scopes={scopeItems}
                  showFileField={true}
                  requireFile={true}
                  requireScope={true}
                  isSubmitting={createMutation.isPending}
                  submitLabel={t('documentsPage.uploadDocument')}
                  submitPendingLabel={t('documentUpload.uploading')}
                  onSubmit={(values) => {
                    if (!values.scopeId || !values.file) {
                      return
                    }
                    createMutation.mutate({
                      name: values.name,
                      scopeId: values.scopeId,
                      file: values.file,
                    })
                  }}
                />
              ) : (
                <DocumentForm
                  scopes={scopeItems}
                  initialName={editingDocument?.name ?? ''}
                  initialScopeId={editingDocument?.scopeId ?? null}
                  showFileField={false}
                  requireFile={false}
                  requireScope={true}
                  isSubmitting={editMutation.isPending}
                  submitLabel={t('documentsPage.saveChanges')}
                  submitPendingLabel={t('documentsPage.savingChanges')}
                  onSubmit={(values) => {
                    if (!editingDocument || !values.scopeId) return
                    editMutation.mutate({
                      id: editingDocument.id,
                      name: values.name,
                      scopeId: values.scopeId,
                    })
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

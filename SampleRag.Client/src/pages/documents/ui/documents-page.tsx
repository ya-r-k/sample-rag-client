import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listDocuments, deleteDocument, uploadDocument, updateDocumentOutdated, type DocumentDto } from '../../../shared/api/documents'
import { DocumentForm } from '../../../features/upload-document/ui/document-form'
import { Button } from '../../../shared/ui/button'
import { useDocumentsPage } from './documents-page.hook'
import { DocumentsPageModal } from './documents-page-modal'

type DocumentsPageProps = {
  isAdmin?: boolean
}

/**
 * Documents admin page — create scopes and upload PDFs.
 * Note: API has no GET /documents; list is left as a simple placeholder.
 */
export function DocumentsPage({ isAdmin = false }: DocumentsPageProps) {
  const {
    t,
    documents,
    modalMode,
    setModalMode,
    editingDocument,
    setEditingDocument,
    createMutation,
    editMutation,
    deleteMutation,
    handleLoadMore,
    isMoreDisabled,
  } = useDocumentsPage(isAdmin)

  const updateOutdatedMutation = useMutation({
    mutationFn: async ({ id, isOutOfDate }: { id: string; isOutOfDate: boolean }) =>
      updateDocumentOutdated(id, { isOutOfDate }),
    onSuccess: (_data, variables) => {
      queryClient.setQueriesData<DocumentDto[]>({ queryKey: ['documents'] }, (prev) =>
        (prev ?? []).map((doc) =>
          doc.id === variables.id ? { ...doc, isOutOfDate: variables.isOutOfDate } : doc,
        ),
      )
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['chats', 20] })
      queryClient.invalidateQueries({ queryKey: ['chat-messages'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['chat-documents-by-ids'], exact: false })
    },
  })

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
                      {doc.isOutOfDate && (
                        <span className="mt-1 inline-flex rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                          {t('documentsPage.outdatedBadge')}
                        </span>
                      )}
                      <div>
                        <span className="mt-1 inline-flex max-w-full items-center rounded-full bg-green-700 px-2 py-0.5 text-[11px] font-medium text-green-100">
                          {doc.scopeName}
                        </span>
                      </div>
                      {doc.localLink && (
                        <a
                          href={`/documents/view?path=${encodeURIComponent(doc.localLink)}&name=${encodeURIComponent(doc.name)}${doc.isOutOfDate ? '&isOutOfDate=1' : ''}`}
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
                        onClick={() => updateOutdatedMutation.mutate({ id: doc.id, isOutOfDate: !doc.isOutOfDate })}
                        className="rounded-md border border-muted bg-background px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        {doc.isOutOfDate ? t('documentsPage.markCurrent') : t('documentsPage.markOutdated')}
                      </Button>
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
            {documents.length > 0 && (
              <Button
                onClick={handleLoadMore}
                disabled={isMoreDisabled}
                className="rounded-md border border-muted bg-background px-3 py-1 text-xs text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('documentsPage.moreDocuments')}
              </Button>
            )}
          </div>
        </div>
      </section>

      {modalMode && (
        <DocumentsPageModal
          modalMode={modalMode}
          editingDocument={editingDocument}
          isCreateSubmitting={createMutation.isPending}
          isEditSubmitting={editMutation.isPending}
          onClose={() => {
            setModalMode(null)
            setEditingDocument(null)
          }}
          onCreateSubmit={(values) => {
            if (!values.scopeId || !values.file) {
              return
            }
            createMutation.mutate({
              name: values.name,
              scopeId: values.scopeId,
              file: values.file,
            })
          }}
          onEditSubmit={(values) => {
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
  )
}

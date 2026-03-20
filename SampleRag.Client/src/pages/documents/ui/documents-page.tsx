import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getGroups } from '../../../shared/api/scopes'
import { listDocuments, deleteDocument } from '../../../shared/api/documents'
import { DocumentUpload } from '../../../features/upload-document/ui/document-upload'
import { CreateScopeForm } from '../../../features/upload-document/ui/create-scope-form'
import { ScopeSelector } from '../../../features/ask-question/ui/scope-selector'

type DocumentsPageProps = {
  isAdmin?: boolean
}

/**
 * Documents admin page — create scopes and upload PDFs.
 * Note: API has no GET /documents; list is left as a simple placeholder.
 */
export function DocumentsPage({ isAdmin = false }: DocumentsPageProps) {
  const [scopeId, setScopeId] = useState<string | null>(null)
  const [lastId, setLastId] = useState<string | undefined>(undefined)
  const batchSize = 10
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  const queryClient = useQueryClient()

  const { data: scopes = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => getGroups(),
  })

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', { lastId, batchSize }],
    queryFn: () => listDocuments({ lastId, batchSize }),
  })

  const hasNextPage = documents.length === batchSize
  const hasPrevPage = lastId !== undefined

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
          <p>You do not have access to document management. This page is available to admins only.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 px-6 py-4">
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-foreground">Documents</h1>
            <p className="text-sm text-muted-foreground">
              Create scopes and upload PDF documents for RAG search.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Upload document
          </button>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-4 rounded-lg border border-muted bg-muted/30 p-4">
          <h2 className="text-sm font-semibold text-foreground">Documents list</h2>
          <p className="text-xs text-muted-foreground">
            Showing up to 10 documents from the API. Use the link to open a document in a new tab.
          </p>
          <div className="mt-3 space-y-2">
            {documents.length === 0 ? (
              <p className="text-xs text-muted-foreground">No documents found.</p>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-muted bg-background px-3 py-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground" title={doc.name}>
                        {doc.name}
                      </p>
                      {doc.localLink && (
                        <a
                          href={doc.localLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 inline-flex text-[11px] text-sky-600 underline hover:text-sky-700"
                        >
                          Open document
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(doc.id)}
                        className="rounded-md border border-destructive bg-destructive px-2 py-1 text-[11px] font-medium text-destructive-foreground hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setLastId(undefined)}
              disabled={!hasPrevPage}
              className="rounded-md border border-muted bg-background px-3 py-1 text-xs text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              First page
            </button>
            <button
              type="button"
              onClick={() => {
                const last = documents[documents.length - 1]
                if (last) setLastId(last.id)
              }}
              disabled={!hasNextPage}
              className="rounded-md border border-muted bg-background px-3 py-1 text-xs text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-muted bg-muted/30 p-4">
          <h2 className="text-sm font-semibold text-foreground">Create scope</h2>
          <p className="text-xs text-muted-foreground">
            Create a new scope (knowledge group) to organize documents.
          </p>
          <CreateScopeForm className="mt-2" />
        </div>
      </section>

      {isUploadOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-lg border border-muted bg-background p-5 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Upload document</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose a scope and upload a PDF file (max 20MB). The document will be chunked and
                  indexed again.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Scope
                </label>
                <ScopeSelector
                  scopes={scopeItems}
                  value={scopeId}
                  onChange={setScopeId}
                  placeholder={scopeItems.length ? 'Select scope' : 'No scopes yet'}
                />
              </div>
              <DocumentUpload
                scopeId={scopeId}
                onUploaded={() => {
                  setIsUploadOpen(false)
                  queryClient.invalidateQueries({ queryKey: ['documents'] })
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


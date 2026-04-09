import { Spinner } from '../../../shared/ui/spinner'
import { useDocumentViewerPage } from './use-document-viewer-page'

export function DocumentViewerPage() {
  const { t, localPath, pageNumber, blobUrl, isLoading, error, title } = useDocumentViewerPage()

  if (!localPath) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <p className="text-sm text-muted-foreground">{t('documentViewer.missingPath')}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />
          <span>{t('documentViewer.loading')}</span>
        </div>
      </div>
    )
  }

  if (error || !blobUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <p className="text-sm text-destructive">{t('documentViewer.error')}</p>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-background">
      <iframe
        title={title}
        src={`${blobUrl}#page=${pageNumber}`}
        className="h-full w-full border-0"
      />
    </div>
  )
}

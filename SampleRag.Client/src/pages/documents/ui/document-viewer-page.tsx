import { Spinner } from '../../../shared/ui/spinner'
import { useDocumentViewerPage } from './document-viewer-page.hook'

export function DocumentViewerPage() {
  const { t, localPath, pageNumber, blobUrl, isLoading, error, title, isOutOfDate } = useDocumentViewerPage()

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
    {isOutOfDate && (
      <div className="w-full bg-red-600 text-white px-4 py-2 text-sm font-semibold">
        Этот документ помечен как устаревший
      </div>
    )}
    <iframe
      title={title}
      src={`${blobUrl}#page=${pageNumber}`}
      className="h-full w-full border-0"
    />
  </div>
  )
}

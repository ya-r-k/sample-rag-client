import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getDocumentAssetBlob } from '../../../shared/api/documents'
import { Spinner } from '../../../shared/ui/spinner'

export function DocumentViewerPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()

  const localPath = searchParams.get('path') ?? ''
  const documentName = searchParams.get('name') ?? t('documentViewer.untitled')

  const { data: blobUrl, isLoading, error } = useQuery({
    queryKey: ['document-viewer', localPath],
    queryFn: async () => {
      const blob = await getDocumentAssetBlob(localPath)
      return URL.createObjectURL(blob)
    },
    enabled: Boolean(localPath),
  })

  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [blobUrl])

  const title = useMemo(() => `${documentName} - ${t('documentViewer.title')}`, [documentName, t])

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
        src={blobUrl}
        className="h-full w-full border-0"
      />
    </div>
  )
}

import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getDocumentAssetBlob } from '../../../shared/api/documents'

export function useDocumentViewerPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()

  const localPath = searchParams.get('path') ?? ''
  const documentName = searchParams.get('name') ?? t('documentViewer.untitled')
  const pageNumber = searchParams.get('page') ?? 1

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

  return {
    t,
    localPath,
    pageNumber,
    blobUrl,
    isLoading,
    error,
    title,
  }
}

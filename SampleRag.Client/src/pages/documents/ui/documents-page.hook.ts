import { useCallback, useMemo, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  deleteDocument,
  listDocuments,
  uploadDocument,
  type DocumentDto,
} from '../../../shared/api/documents'
import { getScopes } from '../../../shared/api/scopes'

const BATCH_SIZE = 10

type DocumentsPageMode = 'create' | 'edit' | null

type DocumentPreviewDto = DocumentDto & {
  scopeName: string
}

export function useDocumentsPage(isAdmin = false) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [modalMode, setModalMode] = useState<DocumentsPageMode>(null)
  const [editingDocument, setEditingDocument] = useState<DocumentDto | null>(null)

  const {
    data: documentPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['documents', { batchSize: BATCH_SIZE }],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => listDocuments({ batchSize: BATCH_SIZE, lastId: pageParam }),
    getNextPageParam: (lastPage) => {
      if (lastPage.length < BATCH_SIZE) return undefined
      return lastPage[lastPage.length - 1]?.id
    },
    enabled: isAdmin,
  })

  const { data: scopes = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => getScopes(),
    enabled: isAdmin,
  })

  const scopeNameById = useMemo(
    () => Object.fromEntries(scopes.map((scope) => [scope.id, scope.name])),
    [scopes],
  )

  const documents = useMemo<DocumentPreviewDto[]>(
    () =>
      documentPages?.pages.flat().map((document) => ({
        ...document,
        scopeName: scopeNameById[document.scopeId] ?? document.scopeId,
      })) ?? [],
    [documentPages, scopeNameById],
  )

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; scopeId: string; file: File }) =>
      uploadDocument(payload),
    onSuccess: () => {
      setModalMode(null)
      setEditingDocument(null)
      void queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  const editMutation = useMutation({
    mutationFn: async (payload: { id: string; name: string; scopeId: string }) => payload,
    onSuccess: () => {
      setModalMode(null)
      setEditingDocument(null)
      void queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage) return
    void fetchNextPage()
  }, [fetchNextPage, hasNextPage])

  const isCreateDisabled = useMemo(
    () => createMutation.isPending,
    [createMutation.isPending],
  )

  const isMoreDisabled = !hasNextPage || isFetchingNextPage

  return {
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
    isCreateDisabled,
    isMoreDisabled,
  }
}

import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { createScope, deleteScope, getScopes, type ScopeDto } from '../../../shared/api/scopes'

const BATCH_SIZE = 10

export function useScopesPage(isAdmin = false) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [scopeToDelete, setScopeToDelete] = useState<ScopeDto | null>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['groups', { batchSize: BATCH_SIZE }],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => getScopes({ batchSize: BATCH_SIZE, lastId: pageParam }),
    getNextPageParam: (lastPage) => {
      if (lastPage.length < BATCH_SIZE) return undefined
      return lastPage[lastPage.length - 1]?.id
    },
    enabled: isAdmin,
  })

  const scopes = useMemo(() => data?.pages.flat() ?? [], [data])

  const createMutation = useMutation({
    mutationFn: createScope,
    onSuccess: () => {
      setNewName('')
      void queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteScope,
    onSuccess: () => {
      setScopeToDelete(null)
      void queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })

  const handleCreateSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const value = newName.trim()
      if (!value || createMutation.isPending) return
      createMutation.mutate([{ name: value }])
    },
    [createMutation, newName],
  )

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage) return
    void fetchNextPage()
  }, [fetchNextPage, hasNextPage])

  const isCreateDisabled = useMemo(
    () => createMutation.isPending || !newName.trim(),
    [createMutation.isPending, newName],
  )

  return {
    t,
    scopes,
    newName,
    setNewName,
    scopeToDelete,
    setScopeToDelete,
    createMutation,
    deleteMutation,
    hasNextPage,
    handleCreateSubmit,
    handleLoadMore,
    isCreateDisabled,
  }
}

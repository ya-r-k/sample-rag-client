import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { createScope } from '../../../shared/api/scopes'

export function useCreateScopeForm() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: createScope,
    onSuccess: () => {
      setName('')
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : t('createScope.failed')
      setError(message)
    },
  })

  const handleSubmit = useCallback(
    (event: SubmitEvent) => {
      event.preventDefault()
      const value = name.trim()
      if (!value || mutation.isPending) return
      mutation.mutate({ name: value })
    },
    [name, mutation],
  )

  const isSubmitDisabled = useMemo(
    () => mutation.isPending || !name.trim(),
    [mutation.isPending, name],
  )

  return {
    t,
    name,
    setName,
    error,
    mutation,
    handleSubmit,
    isSubmitDisabled,
  }
}

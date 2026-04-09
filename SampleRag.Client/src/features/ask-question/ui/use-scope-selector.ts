import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getScopes } from '../../../shared/api/scopes'
import { useKnowledgeScopeStore } from '../../../shared/store/knowledge-scope-store'

type UseScopeSelectorArgs = {
  value: string | null
  onChange: (scopeId: string | null) => void
  placeholder?: string
}

export function useScopeSelector({ value, onChange, placeholder }: UseScopeSelectorArgs) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const scopes = useKnowledgeScopeStore((s) => s.scopes)
  const setScopes = useKnowledgeScopeStore((s) => s.setScopes)

  const { data: loadedScopes = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => getScopes(),
  })

  useEffect(() => {
    if (!loadedScopes.length && !scopes.length) {
      return
    }
    const sameLength = loadedScopes.length === scopes.length
    const sameItems =
      sameLength &&
      loadedScopes.every(
        (scope, index) =>
          scopes[index]?.id === scope.id && scopes[index]?.name === scope.name,
      )
    if (!sameItems) {
      setScopes(loadedScopes)
    }
  }, [loadedScopes, scopes, setScopes])

  useEffect(() => {
    if (!scopes.length) {
      if (value !== null) {
        onChange(null)
      }
      return
    }
    if (!value || !scopes.some((scope) => scope.id === value)) {
      onChange(scopes[0].id)
    }
  }, [scopes, value, onChange])

  const filteredScopes = useMemo(
    () =>
      query === ''
        ? scopes
        : scopes.filter((scope) => scope.name.toLowerCase().includes(query.toLowerCase())),
    [query, scopes],
  )

  const selected = useMemo(() => scopes.find((s) => s.id === value), [scopes, value])
  const effectivePlaceholder = placeholder ?? t('documentsPage.selectScope')

  return {
    t,
    query,
    setQuery,
    filteredScopes,
    selected,
    effectivePlaceholder,
  }
}

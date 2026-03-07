import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getGroups } from '../../../shared/api/groups'
import { sendMessage } from '../../../shared/api/messages'
import { ScopeSelector } from '../../../features/ask-question/ui/scope-selector'
import { QueryInput } from '../../../features/ask-question/ui/query-input'
import { cn } from '../../../shared/lib/cn'

/**
 * Empty-state chat page when user has no chats yet.
 * Query input is primary focus (centered); on submit, redirects to new chat page.
 */
export function EmptyChatPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [scopeId, setScopeId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: scopes = [], isLoading: scopesLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
  })

  const handleSubmit = useCallback(
    async (text: string) => {
      if (isSubmitting || !scopeId) return
      setIsSubmitting(true)
      try {
        const result = await sendMessage({ scopeId, text })
        if (result.chat) {
          queryClient.invalidateQueries({ queryKey: ['chats'] })
          navigate(`/chats/${result.chat.id}`)
        }
      } catch (err) {
        console.error('Send message failed:', err)
      } finally {
        setIsSubmitting(false)
      }
    },
    [scopeId, isSubmitting, navigate, queryClient],
  )

  const canSubmit = scopeId != null && scopes.length > 0 && !scopesLoading && !isSubmitting

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-4">
      <div className="w-full max-w-xl space-y-4 text-center">
        <h1 className="text-xl font-semibold text-foreground">Ask a question</h1>
        <p className="text-sm text-muted-foreground">
          Choose a scope and enter your question to start a new chat.
        </p>
        <div className="rounded-lg border border-muted bg-muted/30 p-4">
          <label className="mb-2 block text-left text-sm font-medium text-muted-foreground">
            Scope
          </label>
          <ScopeSelector
            scopes={scopes}
            value={scopeId}
            onChange={setScopeId}
            disabled={scopesLoading}
            placeholder={scopesLoading ? 'Loading...' : 'Select scope'}
          />
          <div className="mt-4">
            <QueryInput
              onSubmit={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              placeholder={isSubmitting ? 'Sending...' : 'Ask a question...'}
            />
          </div>
          {isSubmitting && (
            <div
              className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground"
              aria-busy="true"
            >
              <Spinner className="h-4 w-4" />
              <span>Creating chat and getting answer...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

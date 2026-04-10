import { useCallback, useEffect, useState } from 'react'

export function useMessageGenerationStepsExpansion(
  isStreaming: boolean,
  streamPhase: 'pre_answer' | 'final_answer' | undefined,
  lastStepId: string | undefined,
) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const phase = streamPhase ?? 'pre_answer'

  useEffect(() => {
    if (!isStreaming) {
      return
    }
    if (phase === 'final_answer') {
      setExpanded(new Set())
      return
    }
    if (!lastStepId) {
      return
    }
    setExpanded((prev) => {
      if (prev.has(lastStepId)) {
        return prev
      }
      const next = new Set(prev)
      next.add(lastStepId)
      return next
    })
  }, [isStreaming, phase, lastStepId])

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  return { expanded, toggle }
}

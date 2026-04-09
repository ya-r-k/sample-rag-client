export type QueryInputProps = {
    onSubmit: (text: string, scopeId: string | null) => void
    chatId?: string | null
    scopeId: string | null
    onScopeIdChange: (scopeId: string | null) => void
    disabled?: boolean
    placeholder?: string
    className?: string
  }
  
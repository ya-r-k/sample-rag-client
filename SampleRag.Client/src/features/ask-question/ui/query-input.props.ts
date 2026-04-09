export type QueryInputProps = {
  onSubmit: (
    chatId: string | null,
    scopeId: string | null,
    text: string,
  ) => void | Promise<void>
  chatId?: string | null
  disabled?: boolean
  placeholder?: string
  className?: string
}

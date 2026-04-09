export type ScopeSelectorProps = {
  value: string | null
  onChange: (scopeId: string | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  flipOptionsUp?: boolean
}

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../../shared/lib/cn'

export type ScopeItem = {
  id: string
  name: string
}

type ScopeSelectorProps = {
  scopes: ScopeItem[]
  value: string | null
  onChange: (scopeId: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ScopeSelector({
  scopes,
  value,
  onChange,
  placeholder = 'Select scope',
  disabled = false,
  className,
}: ScopeSelectorProps) {
  const selected = scopes.find((s) => s.id === value)

  return (
    <Listbox value={value ?? ''} onChange={onChange} disabled={disabled}>
      <div className={cn('relative', className)}>
        <ListboxButton
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-md border border-muted bg-background px-3 py-1 text-left text-sm text-foreground shadow-sm transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          <span className={value ? '' : 'text-muted-foreground'}>
            {selected?.name ?? placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </ListboxButton>
        <ListboxOptions
          anchor="bottom start"
          className={cn(
            'z-10 mt-1 max-h-60 w-[var(--input-width)] overflow-auto rounded-md border border-muted bg-background py-1 shadow-lg',
          )}
        >
          {scopes.map((scope) => (
            <ListboxOption
              key={scope.id}
              value={scope.id}
              className={cn(
                'relative cursor-default select-none py-2 pl-3 pr-9 text-sm',
                'data-[focus]:bg-muted/50 data-[focus]:outline-none',
              )}
            >
              {scope.name}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  )
}

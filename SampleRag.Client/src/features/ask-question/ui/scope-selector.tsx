import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../../shared/lib/cn'
import { useScopeSelector } from './scope-selector.hook'
import { ScopeSelectorProps } from './scope-selector.props'

export type ScopeItem = {
  id: string
  name: string
}

export function ScopeSelector({
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: ScopeSelectorProps) {
  const {
    t,
    setQuery,
    filteredScopes,
    selected,
    effectivePlaceholder,
  } = useScopeSelector({ value, onChange, placeholder })

  return (
    <Combobox
      value={selected ?? null}
      onChange={(next) => onChange(next?.id ?? null)}
      onClose={() => setQuery('')}
      disabled={disabled}
    >
      <div className={cn('relative', className)}>
        <ComboboxInput
          aria-label={t('documentsPage.scope')}
          displayValue={(item: ScopeItem | null) => item?.name ?? ''}
          placeholder={effectivePlaceholder}
          onChange={(event) => setQuery(event.target.value)}
          className={cn(
            'flex h-9 w-full rounded-md border border-muted bg-background px-3 py-1 pr-8 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
          <ChevronDown className="h-4 w-4" />
        </ComboboxButton>
        <ComboboxOptions
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-muted bg-background py-1 shadow-lg"
        >
          {filteredScopes.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              {t('documentsPage.noMatchingScopes')}
            </div>
          ) : (
            filteredScopes.map((scope) => (
              <ComboboxOption
                key={scope.id}
                value={scope}
                className={cn(
                  'relative cursor-default select-none py-2 pl-3 pr-9 text-sm text-foreground',
                  'data-[focus]:bg-muted/50 data-[focus]:outline-none',
                )}
              >
                {scope.name}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  )
}

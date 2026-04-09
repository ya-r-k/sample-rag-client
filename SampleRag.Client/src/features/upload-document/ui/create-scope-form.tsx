import { cn } from '../../../shared/lib/cn'
import { useCreateScopeForm } from './create-scope-form.hook'

type CreateScopeFormProps = {
  className?: string
}

export function CreateScopeForm({ className }: CreateScopeFormProps) {
  const { t, name, setName, error, mutation, handleSubmit, isSubmitDisabled } =
    useCreateScopeForm()

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-2', className)}
      aria-label={t('createScope.ariaLabel')}
    >
      <label className="text-xs font-medium text-muted-foreground" htmlFor="scope-name">
        {t('createScope.label')}
      </label>
      <input
        id="scope-name"
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        placeholder={t('createScope.placeholder')}
        disabled={mutation.isPending}
      />
      <button
        type="submit"
        disabled={isSubmitDisabled}
        className="inline-flex items-center justify-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
      >
        {mutation.isPending ? t('createScope.creating') : t('createScope.create')}
      </button>
      {error && (
        <p className="text-xs text-destructive" role="status">
          {error}
        </p>
      )}
    </form>
  )
}


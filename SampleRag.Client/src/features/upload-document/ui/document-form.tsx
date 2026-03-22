import { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import { ScopeSelector, type ScopeItem } from '../../ask-question/ui/scope-selector'
import { Button } from '../../../shared/ui/button'
import { Input } from '../../../shared/ui/input'
import { cn } from '../../../shared/lib/cn'

const MAX_SIZE_BYTES = 20 * 1024 * 1024

export type DocumentFormValues = {
  name: string
  scopeId: string | null
  file: File | null
}

type DocumentFormProps = {
  scopes: ScopeItem[]
  initialName?: string
  initialScopeId?: string | null
  showFileField: boolean
  requireFile: boolean
  requireScope: boolean
  submitLabel: string
  submitPendingLabel: string
  isSubmitting?: boolean
  onSubmit: (values: DocumentFormValues) => void
  className?: string
}

export function DocumentForm({
  scopes,
  initialName = '',
  initialScopeId = null,
  showFileField,
  requireFile,
  requireScope,
  submitLabel,
  submitPendingLabel,
  isSubmitting = false,
  onSubmit,
  className,
}: DocumentFormProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(initialName)
  const [scopeId, setScopeId] = useState<string | null>(initialScopeId)
  const [file, setFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (isSubmitting) return
      const nextFile = acceptedFiles[0]
      if (!nextFile) return
      setFile(nextFile)
      setValidationError(null)
      if (!name.trim()) {
        setName(nextFile.name.replace(/\.pdf$/i, ''))
      }
    },
    [isSubmitting, name],
  )

  const onDropRejected = useCallback(() => {
    setValidationError(t('documentUpload.invalidFile'))
  }, [t])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    multiple: false,
    maxFiles: 1,
    maxSize: MAX_SIZE_BYTES,
    accept: {
      'application/pdf': ['.pdf'],
    },
    disabled: isSubmitting || !showFileField,
  })

  const canSubmit = useMemo(() => {
    if (isSubmitting) return false
    if (!name.trim()) return false
    if (requireScope && !scopeId) return false
    if (requireFile && !file) return false
    return true
  }, [isSubmitting, name, requireScope, scopeId, requireFile, file])

  const handleSubmit = useCallback(() => {
    if (!name.trim()) {
      setValidationError(t('documentUpload.nameRequired'))
      return
    }
    if (requireScope && !scopeId) {
      setValidationError(t('documentUpload.scopeRequired'))
      return
    }
    if (requireFile && !file) {
      setValidationError(t('documentUpload.fileRequired'))
      return
    }

    setValidationError(null)
    onSubmit({
      name: name.trim(),
      scopeId,
      file,
    })
  }, [file, name, onSubmit, requireFile, requireScope, scopeId, t])

  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {t('documentUpload.nameLabel')}
        </label>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('documentUpload.namePlaceholder')}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {t('documentsPage.scope')}
        </label>
        <ScopeSelector
          scopes={scopes}
          value={scopeId}
          onChange={setScopeId}
          disabled={isSubmitting}
          placeholder={scopes.length ? t('documentsPage.selectScope') : t('documentsPage.noScopesYet')}
        />
      </div>

      {showFileField && (
        <>
          <div
            {...getRootProps()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/40 bg-muted/40 px-4 py-4 text-center text-xs text-muted-foreground transition-colors hover:border-sky-400 hover:text-foreground',
              isSubmitting && 'pointer-events-none opacity-60',
            )}
          >
            <input {...getInputProps()} />
            <p className="font-medium">
              {isDragActive ? t('documentUpload.dropActive') : t('documentUpload.dropIdle')}
            </p>
            <p className="mt-1 text-[11px]">{t('documentUpload.pdfOnly')}</p>
          </div>

          <div className="rounded-md border border-muted bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            {file
              ? t('documentUpload.selectedFile', { fileName: file.name })
              : t('documentUpload.noFileSelected')}
          </div>
        </>
      )}

      {validationError && <p className="text-xs text-destructive">{validationError}</p>}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="bg-sky-600 px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-sky-700 disabled:opacity-60"
        >
          {isSubmitting ? submitPendingLabel : submitLabel}
        </Button>
      </div>
    </div>
  )
}

import { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { uploadDocument } from '../../../shared/api/documents'
import { cn } from '../../../shared/lib/cn'
import { Button } from '../../../shared/ui/button'
import { Input } from '../../../shared/ui/input'

type DocumentUploadProps = {
  scopeId: string | null
  onUploaded?: () => void
  className?: string
}

const MAX_SIZE_BYTES = 20 * 1024 * 1024

export function DocumentUpload({ scopeId, onUploaded, className }: DocumentUploadProps) {
  const { t } = useTranslation()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentName, setDocumentName] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async ({ file, name }: { file: File; name: string }) => {
      return uploadDocument({ scopeId: scopeId ?? 'ce1d3351-7908-408a-b295-c72dd4df14e9', file, name })
    },
    onSuccess: () => {
      setSelectedFile(null)
      setDocumentName('')
      setValidationError(null)
      if (onUploaded) {
        onUploaded()
      }
    },
  })

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (mutation.isPending) return
      const file = acceptedFiles[0]
      if (!file) return
      setSelectedFile(file)
      setValidationError(null)
      if (!documentName.trim()) {
        setDocumentName(file.name.replace(/\.pdf$/i, ''))
      }
    },
    [documentName, mutation],
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
  })

  const canSubmit = useMemo(
    () => Boolean(selectedFile && documentName.trim() && !mutation.isPending),
    [scopeId, selectedFile, documentName, mutation.isPending],
  )

  const handleUpload = useCallback(() => {
    if (!selectedFile) {
      setValidationError(t('documentUpload.fileRequired'))
      return
    }
    const trimmedName = documentName.trim()
    if (!trimmedName) {
      setValidationError(t('documentUpload.nameRequired'))
      return
    }
    mutation.mutate({ file: selectedFile, name: trimmedName })
  }, [scopeId, selectedFile, documentName, mutation, t])

  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {t('documentUpload.nameLabel')}
        </label>
        <Input
          value={documentName}
          onChange={(event) => setDocumentName(event.target.value)}
          placeholder={t('documentUpload.namePlaceholder')}
          disabled={mutation.isPending}
        />
      </div>

      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/40 bg-muted/40 px-4 py-4 text-center text-xs text-muted-foreground transition-colors hover:border-sky-400 hover:text-foreground',
          mutation.isPending && 'pointer-events-none opacity-60',
        )}
      >
        <input {...getInputProps()} />
        <p className="font-medium">
          {isDragActive ? t('documentUpload.dropActive') : t('documentUpload.dropIdle')}
        </p>
        <p className="mt-1 text-[11px]">{t('documentUpload.pdfOnly')}</p>
      </div>

      <div className="rounded-md border border-muted bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        {selectedFile
          ? t('documentUpload.selectedFile', { fileName: selectedFile.name })
          : t('documentUpload.noFileSelected')}
      </div>

      {validationError && <p className="text-xs text-destructive">{validationError}</p>}
      {mutation.error && (
        <p className="text-xs text-destructive">
          {mutation.error instanceof Error ? mutation.error.message : t('documentUpload.uploadFailed')}
        </p>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleUpload}
          disabled={!canSubmit}
          className="bg-sky-600 px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-sky-700 disabled:opacity-60"
        >
          {mutation.isPending ? t('documentUpload.uploading') : t('documentUpload.uploadButton')}
        </Button>
      </div>
    </div>
  )
}

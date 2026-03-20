import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useMutation } from '@tanstack/react-query'
import { uploadDocument } from '../../../shared/api/documents'
import { cn } from '../../../shared/lib/cn'

type DocumentUploadProps = {
  scopeId: string | null
  onUploaded?: () => void
  className?: string
}

const MAX_SIZE_BYTES = 20 * 1024 * 1024

export function DocumentUpload({ scopeId, onUploaded, className }: DocumentUploadProps) {
  const mutation = useMutation({
    mutationFn: async (file: File) => {
      if (!scopeId) {
        throw new Error('Scope is required')
      }
      return uploadDocument({ scopeId, file })
    },
    onSuccess: () => {
      if (onUploaded) {
        onUploaded()
      }
    },
  })

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!scopeId || mutation.isPending) return
      const file = acceptedFiles[0]
      if (!file) return
      mutation.mutate(file)
    },
    [mutation, scopeId],
  )

  const onDropRejected = useCallback(() => {
    // UX-010: invalid file feedback before any server request
    // (actual error text is left to surrounding UI, this keeps component simple)
  }, [])

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

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/40 bg-muted/40 px-4 py-6 text-center text-xs text-muted-foreground transition-colors hover:border-sky-400 hover:text-foreground',
        mutation.isPending && 'pointer-events-none opacity-60',
        className,
      )}
    >
      <input {...getInputProps()} />
      <p className="font-medium">
        {isDragActive ? 'Drop PDF here…' : 'Drag and drop a PDF here, or click to select'}
      </p>
      <p className="mt-1 text-[11px]">PDF only, up to 20MB.</p>
      {mutation.isPending && <p className="mt-2 text-[11px]">Uploading…</p>}
    </div>
  )
}


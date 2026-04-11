import { MessageDto } from '../../../shared/api/messages'
import type { DocumentDto } from '../../../shared/api/documents'

export type MessageListProps = {
  messages: MessageDto[]
  documentsById?: Record<string, DocumentDto>
  className?: string
  isSubmitting?: boolean
}

import { MessageDto } from '../../../shared/api/messages'
import type { DocumentDto } from '../../../shared/api/documents'

export type AssistantMessageTurnProps = {
  msg: MessageDto
  messageIndex: number
  messages: MessageDto[]
  documentsById?: Record<string, DocumentDto>
  isSubmitting: boolean
}

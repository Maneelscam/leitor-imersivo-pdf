import type { Book } from '@/models/entities/Book'

export const PdfImportWarningCode = {
  COVER_GENERATION_FAILED: 'cover-generation-failed',
  DOCUMENT_CLEANUP_FAILED: 'document-cleanup-failed',
} as const

export type PdfImportWarningCode =
  (typeof PdfImportWarningCode)[keyof typeof PdfImportWarningCode]

export interface PdfImportResult {
  readonly book: Book
  readonly warnings: readonly PdfImportWarningCode[]
}
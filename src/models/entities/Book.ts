import type { BookId } from '@/models/value-objects/BookId'
import type { IsoDateTime } from '@/models/value-objects/IsoDateTime'

export type PdfMimeType = 'application/pdf'

export interface Book {
  readonly id: BookId

  readonly title: string
  readonly author: string | null

  readonly originalFileName: string
  readonly fileSizeBytes: number
  readonly mimeType: PdfMimeType

  readonly totalPages: number
  readonly pdfFingerprint: string | null

  readonly importedAt: IsoDateTime
  readonly updatedAt: IsoDateTime
  readonly lastOpenedAt: IsoDateTime | null
}
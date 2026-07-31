import type { BookId } from '@/models/value-objects/BookId'
import type { IsoDateTime } from '@/models/value-objects/IsoDateTime'

export type BookCoverMimeType = 'image/webp'

export interface BookCover {
  readonly bookId: BookId

  readonly image: Blob
  readonly mimeType: BookCoverMimeType

  readonly width: number
  readonly height: number

  readonly generatedAt: IsoDateTime
}
import type { BookId } from '@/models/value-objects/BookId'
import type { IsoDateTime } from '@/models/value-objects/IsoDateTime'

export interface ReadingProgress {
  readonly bookId: BookId

  readonly currentPage: number
  readonly pageOffsetRatio: number

  readonly updatedAt: IsoDateTime
}
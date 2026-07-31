import type { BookmarkId } from '@/models/value-objects/BookmarkId'
import type { BookId } from '@/models/value-objects/BookId'
import type { IsoDateTime } from '@/models/value-objects/IsoDateTime'

export interface Bookmark {
  readonly id: BookmarkId
  readonly bookId: BookId

  readonly pageNumber: number
  readonly pageOffsetRatio: number

  readonly createdAt: IsoDateTime
}
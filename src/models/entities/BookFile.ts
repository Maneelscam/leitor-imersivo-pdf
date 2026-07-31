import type { BookId } from '@/models/value-objects/BookId'
import type { IsoDateTime } from '@/models/value-objects/IsoDateTime'

export interface BookFile {
  readonly bookId: BookId
  readonly file: Blob
  readonly storedAt: IsoDateTime
}
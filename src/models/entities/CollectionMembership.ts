import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  CollectionId,
} from '@/models/value-objects/CollectionId'
import type {
  IsoDateTime,
} from '@/models/value-objects/IsoDateTime'

export interface CollectionMembership {
  readonly collectionId:
    CollectionId

  readonly bookId:
    BookId

  readonly addedAt:
    IsoDateTime
}

import type {
  CollectionMembership,
} from '@/models/entities/CollectionMembership'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  CollectionId,
} from '@/models/value-objects/CollectionId'

export interface CollectionMembershipRepository {
  save(
    membership: CollectionMembership,
  ): Promise<void>

  exists(
    collectionId: CollectionId,
    bookId: BookId,
  ): Promise<boolean>

  findByCollectionId(
    collectionId: CollectionId,
  ): Promise<readonly CollectionMembership[]>

  findByBookId(
    bookId: BookId,
  ): Promise<readonly CollectionMembership[]>

  delete(
    collectionId: CollectionId,
    bookId: BookId,
  ): Promise<void>

  deleteByCollectionId(
    collectionId: CollectionId,
  ): Promise<void>

  deleteByBookId(
    bookId: BookId,
  ): Promise<void>
}

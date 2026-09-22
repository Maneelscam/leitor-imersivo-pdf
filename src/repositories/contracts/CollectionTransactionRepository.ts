import type {
  CollectionId,
} from '@/models/value-objects/CollectionId'

export interface CollectionTransactionRepository {
  deleteCollectionCompletely(
    collectionId: CollectionId,
  ): Promise<void>
}

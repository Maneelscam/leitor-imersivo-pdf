import type {
  Collection,
} from '@/models/entities/Collection'
import type {
  CollectionId,
} from '@/models/value-objects/CollectionId'

export interface CollectionRepository {
  save(
    collection: Collection,
  ): Promise<void>

  findById(
    collectionId: CollectionId,
  ): Promise<Collection | null>

  findByNormalizedName(
    normalizedName: string,
  ): Promise<Collection | null>

  findAll():
    Promise<readonly Collection[]>

  deleteById(
    collectionId: CollectionId,
  ): Promise<void>
}

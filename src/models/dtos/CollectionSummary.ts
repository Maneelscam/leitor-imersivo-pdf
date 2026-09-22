import type {
  Collection,
} from '@/models/entities/Collection'

export interface CollectionSummary {
  readonly collection: Collection
  readonly bookCount: number
}

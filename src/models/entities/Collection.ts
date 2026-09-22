import type {
  CollectionId,
} from '@/models/value-objects/CollectionId'
import type {
  IsoDateTime,
} from '@/models/value-objects/IsoDateTime'

export interface Collection {
  readonly id: CollectionId

  readonly name: string
  readonly normalizedName: string
  readonly description: string | null

  readonly createdAt: IsoDateTime
  readonly updatedAt: IsoDateTime
}

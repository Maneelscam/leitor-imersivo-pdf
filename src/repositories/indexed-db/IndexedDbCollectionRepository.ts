import {
  DATABASE_INDEX_NAMES,
} from '@/database/stores/databaseIndexNames'
import {
  DATABASE_STORE_NAMES,
} from '@/database/stores/databaseStoreNames'
import {
  getIndexedDbConnection,
} from '@/database/indexedDbConnection'
import {
  requestToPromise,
  transactionToPromise,
} from '@/database/indexedDbPromises'
import type {
  Collection,
} from '@/models/entities/Collection'
import type {
  CollectionId,
} from '@/models/value-objects/CollectionId'
import type {
  CollectionRepository,
} from '@/repositories/contracts/CollectionRepository'

export class IndexedDbCollectionRepository
implements CollectionRepository {
  async save(
    collection: Collection,
  ): Promise<void> {
    const database =
      await getIndexedDbConnection()

    const transaction =
      database.transaction(
        DATABASE_STORE_NAMES.COLLECTIONS,
        'readwrite',
      )

    const completed =
      transactionToPromise(
        transaction,
      )

    transaction
      .objectStore(
        DATABASE_STORE_NAMES.COLLECTIONS,
      )
      .put(collection)

    await completed
  }

  async findById(
    collectionId: CollectionId,
  ): Promise<Collection | null> {
    const database =
      await getIndexedDbConnection()

    const transaction =
      database.transaction(
        DATABASE_STORE_NAMES.COLLECTIONS,
        'readonly',
      )

    const completed =
      transactionToPromise(
        transaction,
      )

    const collection =
      await requestToPromise(
        transaction
          .objectStore(
            DATABASE_STORE_NAMES.COLLECTIONS,
          )
          .get(
            collectionId,
          ) as IDBRequest<
            Collection | undefined
          >,
      )

    await completed

    return collection ?? null
  }

  async findByNormalizedName(
    normalizedName: string,
  ): Promise<Collection | null> {
    const normalizedValue =
      normalizedName.trim()

    if (
      normalizedValue.length === 0
    ) {
      return null
    }

    const database =
      await getIndexedDbConnection()

    const transaction =
      database.transaction(
        DATABASE_STORE_NAMES.COLLECTIONS,
        'readonly',
      )

    const completed =
      transactionToPromise(
        transaction,
      )

    const collection =
      await requestToPromise(
        transaction
          .objectStore(
            DATABASE_STORE_NAMES.COLLECTIONS,
          )
          .index(
            DATABASE_INDEX_NAMES
              .COLLECTIONS
              .BY_NORMALIZED_NAME,
          )
          .get(
            normalizedValue,
          ) as IDBRequest<
            Collection | undefined
          >,
      )

    await completed

    return collection ?? null
  }

  async findAll():
    Promise<readonly Collection[]> {
    const database =
      await getIndexedDbConnection()

    const transaction =
      database.transaction(
        DATABASE_STORE_NAMES.COLLECTIONS,
        'readonly',
      )

    const completed =
      transactionToPromise(
        transaction,
      )

    const collections =
      await requestToPromise(
        transaction
          .objectStore(
            DATABASE_STORE_NAMES.COLLECTIONS,
          )
          .getAll() as IDBRequest<
            Collection[]
          >,
      )

    await completed

    return collections
  }

  async deleteById(
    collectionId: CollectionId,
  ): Promise<void> {
    const database =
      await getIndexedDbConnection()

    const transaction =
      database.transaction(
        DATABASE_STORE_NAMES.COLLECTIONS,
        'readwrite',
      )

    const completed =
      transactionToPromise(
        transaction,
      )

    transaction
      .objectStore(
        DATABASE_STORE_NAMES.COLLECTIONS,
      )
      .delete(collectionId)

    await completed
  }
}

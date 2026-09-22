import {
  getIndexedDbConnection,
} from '@/database/indexedDbConnection'
import {
  transactionToPromise,
} from '@/database/indexedDbPromises'
import {
  DATABASE_INDEX_NAMES,
} from '@/database/stores/databaseIndexNames'
import {
  DATABASE_STORE_NAMES,
} from '@/database/stores/databaseStoreNames'
import type {
  CollectionId,
} from '@/models/value-objects/CollectionId'
import type {
  CollectionTransactionRepository,
} from '@/repositories/contracts/CollectionTransactionRepository'

function abortTransactionSafely(
  transaction: IDBTransaction,
): void {
  try {
    transaction.abort()
  } catch {
    return
  }
}

export class IndexedDbCollectionTransactionRepository
implements CollectionTransactionRepository {
  async deleteCollectionCompletely(
    collectionId: CollectionId,
  ): Promise<void> {
    const database =
      await getIndexedDbConnection()

    const transaction =
      database.transaction(
        [
          DATABASE_STORE_NAMES.COLLECTIONS,
          DATABASE_STORE_NAMES
            .COLLECTION_MEMBERSHIPS,
        ],
        'readwrite',
      )

    const completed =
      transactionToPromise(
        transaction,
      )

    try {
      transaction
        .objectStore(
          DATABASE_STORE_NAMES.COLLECTIONS,
        )
        .delete(collectionId)

      const membershipsStore =
        transaction.objectStore(
          DATABASE_STORE_NAMES
            .COLLECTION_MEMBERSHIPS,
        )

      const collectionIndex =
        membershipsStore.index(
          DATABASE_INDEX_NAMES
            .COLLECTION_MEMBERSHIPS
            .BY_COLLECTION_ID,
        )

      const cursorRequest =
        collectionIndex.openCursor(
          IDBKeyRange.only(
            collectionId,
          ),
        )

      cursorRequest.addEventListener(
        'success',
        () => {
          const cursor =
            cursorRequest.result

          if (cursor === null) {
            return
          }

          cursor.delete()
          cursor.continue()
        },
      )

      await completed
    } catch (error) {
      abortTransactionSafely(
        transaction,
      )

      throw error
    }
  }
}

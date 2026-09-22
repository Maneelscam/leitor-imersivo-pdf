import {
  DATABASE_INDEX_NAMES,
} from '@/database/stores/databaseIndexNames'
import {
  DATABASE_STORE_NAMES,
} from '@/database/stores/databaseStoreNames'

export function createDatabaseSchemaV4(
  database: IDBDatabase,
): void {
  if (
    !database.objectStoreNames.contains(
      DATABASE_STORE_NAMES.COLLECTIONS,
    )
  ) {
    const collectionsStore =
      database.createObjectStore(
        DATABASE_STORE_NAMES.COLLECTIONS,
        {
          keyPath: 'id',
        },
      )

    collectionsStore.createIndex(
      DATABASE_INDEX_NAMES.COLLECTIONS
        .BY_NORMALIZED_NAME,
      'normalizedName',
      {
        unique: true,
      },
    )

    collectionsStore.createIndex(
      DATABASE_INDEX_NAMES.COLLECTIONS
        .BY_CREATED_AT,
      'createdAt',
      {
        unique: false,
      },
    )

    collectionsStore.createIndex(
      DATABASE_INDEX_NAMES.COLLECTIONS
        .BY_UPDATED_AT,
      'updatedAt',
      {
        unique: false,
      },
    )
  }

  if (
    !database.objectStoreNames.contains(
      DATABASE_STORE_NAMES
        .COLLECTION_MEMBERSHIPS,
    )
  ) {
    const membershipsStore =
      database.createObjectStore(
        DATABASE_STORE_NAMES
          .COLLECTION_MEMBERSHIPS,
        {
          keyPath: [
            'collectionId',
            'bookId',
          ],
        },
      )

    membershipsStore.createIndex(
      DATABASE_INDEX_NAMES
        .COLLECTION_MEMBERSHIPS
        .BY_COLLECTION_ID,
      'collectionId',
      {
        unique: false,
      },
    )

    membershipsStore.createIndex(
      DATABASE_INDEX_NAMES
        .COLLECTION_MEMBERSHIPS
        .BY_BOOK_ID,
      'bookId',
      {
        unique: false,
      },
    )

    membershipsStore.createIndex(
      DATABASE_INDEX_NAMES
        .COLLECTION_MEMBERSHIPS
        .BY_ADDED_AT,
      'addedAt',
      {
        unique: false,
      },
    )
  }
}

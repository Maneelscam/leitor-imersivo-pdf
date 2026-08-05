import {
  DATABASE_INDEX_NAMES,
} from '@/database/stores/databaseIndexNames'
import {
  DATABASE_STORE_NAMES,
} from '@/database/stores/databaseStoreNames'

export function createDatabaseSchemaV2(
  database: IDBDatabase,
): void {
  if (
    database.objectStoreNames.contains(
      DATABASE_STORE_NAMES.ANNOTATIONS,
    )
  ) {
    return
  }

  const annotationsStore =
    database.createObjectStore(
      DATABASE_STORE_NAMES.ANNOTATIONS,
      {
        keyPath: 'id',
      },
    )

  annotationsStore.createIndex(
    DATABASE_INDEX_NAMES.ANNOTATIONS.BY_BOOK_ID,
    'bookId',
    {
      unique: false,
    },
  )

  annotationsStore.createIndex(
    DATABASE_INDEX_NAMES.ANNOTATIONS
      .BY_BOOK_AND_PAGE,
    ['bookId', 'pageNumber'],
    {
      unique: false,
    },
  )

  annotationsStore.createIndex(
    DATABASE_INDEX_NAMES.ANNOTATIONS
      .BY_CREATED_AT,
    'createdAt',
    {
      unique: false,
    },
  )

  annotationsStore.createIndex(
    DATABASE_INDEX_NAMES.ANNOTATIONS
      .BY_UPDATED_AT,
    'updatedAt',
    {
      unique: false,
    },
  )
}
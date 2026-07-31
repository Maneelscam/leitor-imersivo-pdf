import { DATABASE_INDEX_NAMES } from '@/database/stores/databaseIndexNames'
import { DATABASE_STORE_NAMES } from '@/database/stores/databaseStoreNames'

export function createDatabaseSchemaV1(database: IDBDatabase): void {
  const booksStore = database.createObjectStore(
    DATABASE_STORE_NAMES.BOOKS,
    {
      keyPath: 'id',
    },
  )

  booksStore.createIndex(
    DATABASE_INDEX_NAMES.BOOKS.BY_TITLE,
    'title',
    {
      unique: false,
    },
  )

  booksStore.createIndex(
    DATABASE_INDEX_NAMES.BOOKS.BY_IMPORTED_AT,
    'importedAt',
    {
      unique: false,
    },
  )

  booksStore.createIndex(
    DATABASE_INDEX_NAMES.BOOKS.BY_LAST_OPENED_AT,
    'lastOpenedAt',
    {
      unique: false,
    },
  )

  booksStore.createIndex(
    DATABASE_INDEX_NAMES.BOOKS.BY_PDF_FINGERPRINT,
    'pdfFingerprint',
    {
      unique: true,
    },
  )

  database.createObjectStore(
    DATABASE_STORE_NAMES.BOOK_FILES,
    {
      keyPath: 'bookId',
    },
  )

  database.createObjectStore(
    DATABASE_STORE_NAMES.BOOK_COVERS,
    {
      keyPath: 'bookId',
    },
  )

  database.createObjectStore(
    DATABASE_STORE_NAMES.READING_PROGRESS,
    {
      keyPath: 'bookId',
    },
  )

  const bookmarksStore = database.createObjectStore(
    DATABASE_STORE_NAMES.BOOKMARKS,
    {
      keyPath: 'id',
    },
  )

  bookmarksStore.createIndex(
    DATABASE_INDEX_NAMES.BOOKMARKS.BY_BOOK_ID,
    'bookId',
    {
      unique: false,
    },
  )

  bookmarksStore.createIndex(
    DATABASE_INDEX_NAMES.BOOKMARKS.BY_BOOK_AND_PAGE,
    ['bookId', 'pageNumber'],
    {
      unique: true,
    },
  )

  bookmarksStore.createIndex(
    DATABASE_INDEX_NAMES.BOOKMARKS.BY_CREATED_AT,
    'createdAt',
    {
      unique: false,
    },
  )

  database.createObjectStore(
    DATABASE_STORE_NAMES.READER_SETTINGS,
  )
}
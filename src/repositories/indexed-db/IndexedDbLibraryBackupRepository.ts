import {
  getIndexedDbConnection,
} from '@/database/indexedDbConnection'
import {
  requestToPromise,
  transactionToPromise,
} from '@/database/indexedDbPromises'
import {
  READER_SETTINGS_RECORD_KEY,
} from '@/database/schemas/databaseSchema'
import {
  DATABASE_STORE_NAMES,
} from '@/database/stores/databaseStoreNames'
import type {
  LibraryBackupSnapshot,
} from '@/models/dtos/LibraryBackup'
import type {
  Annotation,
} from '@/models/entities/Annotation'
import type {
  Book,
} from '@/models/entities/Book'
import type {
  BookCover,
} from '@/models/entities/BookCover'
import type {
  BookFile,
} from '@/models/entities/BookFile'
import type {
  Bookmark,
} from '@/models/entities/Bookmark'
import type {
  ReaderSettings,
} from '@/models/entities/ReaderSettings'
import type {
  ReadingProgress,
} from '@/models/entities/ReadingProgress'
import type {
  LibraryBackupRepository,
} from '@/repositories/contracts/LibraryBackupRepository'

const BACKUP_STORE_NAMES = [
  DATABASE_STORE_NAMES.BOOKS,
  DATABASE_STORE_NAMES.BOOK_FILES,
  DATABASE_STORE_NAMES.BOOK_COVERS,
  DATABASE_STORE_NAMES.READING_PROGRESS,
  DATABASE_STORE_NAMES.BOOKMARKS,
  DATABASE_STORE_NAMES.ANNOTATIONS,
  DATABASE_STORE_NAMES.READER_SETTINGS,
] as const

function abortTransactionSafely(
  transaction: IDBTransaction,
): void {
  try {
    transaction.abort()
  } catch {
    return
  }
}

export class IndexedDbLibraryBackupRepository
  implements LibraryBackupRepository
{
  async createSnapshot():
    Promise<LibraryBackupSnapshot> {
    const database =
      await getIndexedDbConnection()

    const transaction =
      database.transaction(
        BACKUP_STORE_NAMES,
        'readonly',
      )

    const transactionCompleted =
      transactionToPromise(
        transaction,
      )

    try {
      const booksPromise =
        requestToPromise(
          transaction
            .objectStore(
              DATABASE_STORE_NAMES.BOOKS,
            )
            .getAll(),
        ) as Promise<Book[]>

      const bookFilesPromise =
        requestToPromise(
          transaction
            .objectStore(
              DATABASE_STORE_NAMES.BOOK_FILES,
            )
            .getAll(),
        ) as Promise<BookFile[]>

      const bookCoversPromise =
        requestToPromise(
          transaction
            .objectStore(
              DATABASE_STORE_NAMES.BOOK_COVERS,
            )
            .getAll(),
        ) as Promise<BookCover[]>

      const readingProgressPromise =
        requestToPromise(
          transaction
            .objectStore(
              DATABASE_STORE_NAMES.READING_PROGRESS,
            )
            .getAll(),
        ) as Promise<ReadingProgress[]>

      const bookmarksPromise =
        requestToPromise(
          transaction
            .objectStore(
              DATABASE_STORE_NAMES.BOOKMARKS,
            )
            .getAll(),
        ) as Promise<Bookmark[]>

      const annotationsPromise =
        requestToPromise(
          transaction
            .objectStore(
              DATABASE_STORE_NAMES.ANNOTATIONS,
            )
            .getAll(),
        ) as Promise<Annotation[]>

      const readerSettingsPromise =
        requestToPromise(
          transaction
            .objectStore(
              DATABASE_STORE_NAMES.READER_SETTINGS,
            )
            .get(
              READER_SETTINGS_RECORD_KEY,
            ),
        ) as Promise<
          ReaderSettings | undefined
        >

      const [
        books,
        bookFiles,
        bookCovers,
        readingProgress,
        bookmarks,
        annotations,
        readerSettings,
      ] = await Promise.all([
        booksPromise,
        bookFilesPromise,
        bookCoversPromise,
        readingProgressPromise,
        bookmarksPromise,
        annotationsPromise,
        readerSettingsPromise,
      ])

      await transactionCompleted

      return {
        books,
        bookFiles,
        bookCovers,
        readingProgress,
        bookmarks,
        annotations,
        readerSettings:
          readerSettings ?? null,
      }
    } catch (error) {
      abortTransactionSafely(
        transaction,
      )

      throw error
    }
  }

  async replaceLibraryWithSnapshot(
    snapshot: LibraryBackupSnapshot,
  ): Promise<void> {
    const database =
      await getIndexedDbConnection()

    const transaction =
      database.transaction(
        BACKUP_STORE_NAMES,
        'readwrite',
      )

    const transactionCompleted =
      transactionToPromise(
        transaction,
      )

    try {
      const booksStore =
        transaction.objectStore(
          DATABASE_STORE_NAMES.BOOKS,
        )

      const bookFilesStore =
        transaction.objectStore(
          DATABASE_STORE_NAMES.BOOK_FILES,
        )

      const bookCoversStore =
        transaction.objectStore(
          DATABASE_STORE_NAMES.BOOK_COVERS,
        )

      const readingProgressStore =
        transaction.objectStore(
          DATABASE_STORE_NAMES.READING_PROGRESS,
        )

      const bookmarksStore =
        transaction.objectStore(
          DATABASE_STORE_NAMES.BOOKMARKS,
        )

      const annotationsStore =
        transaction.objectStore(
          DATABASE_STORE_NAMES.ANNOTATIONS,
        )

      const readerSettingsStore =
        transaction.objectStore(
          DATABASE_STORE_NAMES.READER_SETTINGS,
        )

      booksStore.clear()
      bookFilesStore.clear()
      bookCoversStore.clear()
      readingProgressStore.clear()
      bookmarksStore.clear()
      annotationsStore.clear()
      readerSettingsStore.clear()

      for (
        const book of snapshot.books
      ) {
        booksStore.put(book)
      }

      for (
        const bookFile of
        snapshot.bookFiles
      ) {
        bookFilesStore.put(
          bookFile,
        )
      }

      for (
        const bookCover of
        snapshot.bookCovers
      ) {
        bookCoversStore.put(
          bookCover,
        )
      }

      for (
        const progress of
        snapshot.readingProgress
      ) {
        readingProgressStore.put(
          progress,
        )
      }

      for (
        const bookmark of
        snapshot.bookmarks
      ) {
        bookmarksStore.put(
          bookmark,
        )
      }

      for (
        const annotation of
        snapshot.annotations
      ) {
        annotationsStore.put(
          annotation,
        )
      }

      if (
        snapshot.readerSettings !==
        null
      ) {
        readerSettingsStore.put(
          snapshot.readerSettings,
          READER_SETTINGS_RECORD_KEY,
        )
      }

      await transactionCompleted
    } catch (error) {
      abortTransactionSafely(
        transaction,
      )

      throw error
    }
  }
}

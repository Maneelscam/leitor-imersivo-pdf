import { getIndexedDbConnection } from '@/database/indexedDbConnection'
import { transactionToPromise } from '@/database/indexedDbPromises'
import { DATABASE_INDEX_NAMES } from '@/database/stores/databaseIndexNames'
import { DATABASE_STORE_NAMES } from '@/database/stores/databaseStoreNames'
import type { ImportedBookData } from '@/models/dtos/ImportedBookData'
import type { BookId } from '@/models/value-objects/BookId'
import type { LibraryTransactionRepository } from '@/repositories/contracts/LibraryTransactionRepository'

function abortTransactionSafely(transaction: IDBTransaction): void {
  try {
    transaction.abort()
  } catch {
    return
  }
}

function deleteBookmarksByBookId(
  bookmarksStore: IDBObjectStore,
  bookId: BookId,
): void {
  const bookIdIndex = bookmarksStore.index(
    DATABASE_INDEX_NAMES.BOOKMARKS.BY_BOOK_ID,
  )

  const cursorRequest = bookIdIndex.openCursor(
    IDBKeyRange.only(bookId),
  )

  cursorRequest.addEventListener('success', () => {
    const cursor = cursorRequest.result

    if (cursor === null) {
      return
    }

    cursor.delete()
    cursor.continue()
  })
}

export class IndexedDbLibraryTransactionRepository
  implements LibraryTransactionRepository
{
  async saveImportedBook(data: ImportedBookData): Promise<void> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      [
        DATABASE_STORE_NAMES.BOOKS,
        DATABASE_STORE_NAMES.BOOK_FILES,
        DATABASE_STORE_NAMES.BOOK_COVERS,
      ],
      'readwrite',
    )

    const transactionCompleted = transactionToPromise(transaction)

    try {
      const booksStore = transaction.objectStore(
        DATABASE_STORE_NAMES.BOOKS,
      )
      const bookFilesStore = transaction.objectStore(
        DATABASE_STORE_NAMES.BOOK_FILES,
      )
      const bookCoversStore = transaction.objectStore(
        DATABASE_STORE_NAMES.BOOK_COVERS,
      )

      booksStore.put(data.book)
      bookFilesStore.put(data.bookFile)

      if (data.bookCover !== null) {
        bookCoversStore.put(data.bookCover)
      }

      await transactionCompleted
    } catch (error) {
      abortTransactionSafely(transaction)
      throw error
    }
  }

  async deleteBookCompletely(bookId: BookId): Promise<void> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      [
        DATABASE_STORE_NAMES.BOOKS,
        DATABASE_STORE_NAMES.BOOK_FILES,
        DATABASE_STORE_NAMES.BOOK_COVERS,
        DATABASE_STORE_NAMES.READING_PROGRESS,
        DATABASE_STORE_NAMES.BOOKMARKS,
      ],
      'readwrite',
    )

    const transactionCompleted = transactionToPromise(transaction)

    try {
      transaction
        .objectStore(DATABASE_STORE_NAMES.BOOKS)
        .delete(bookId)

      transaction
        .objectStore(DATABASE_STORE_NAMES.BOOK_FILES)
        .delete(bookId)

      transaction
        .objectStore(DATABASE_STORE_NAMES.BOOK_COVERS)
        .delete(bookId)

      transaction
        .objectStore(DATABASE_STORE_NAMES.READING_PROGRESS)
        .delete(bookId)

      const bookmarksStore = transaction.objectStore(
        DATABASE_STORE_NAMES.BOOKMARKS,
      )

      deleteBookmarksByBookId(bookmarksStore, bookId)

      await transactionCompleted
    } catch (error) {
      abortTransactionSafely(transaction)
      throw error
    }
  }
}
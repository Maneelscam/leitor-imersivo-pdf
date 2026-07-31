import { getIndexedDbConnection } from '@/database/indexedDbConnection'
import {
  requestToPromise,
  transactionToPromise,
} from '@/database/indexedDbPromises'
import { DATABASE_INDEX_NAMES } from '@/database/stores/databaseIndexNames'
import { DATABASE_STORE_NAMES } from '@/database/stores/databaseStoreNames'
import type { Bookmark } from '@/models/entities/Bookmark'
import type { BookmarkId } from '@/models/value-objects/BookmarkId'
import type { BookId } from '@/models/value-objects/BookId'
import type { BookmarkRepository } from '@/repositories/contracts/BookmarkRepository'

export class IndexedDbBookmarkRepository
  implements BookmarkRepository
{
  async save(bookmark: Bookmark): Promise<void> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.BOOKMARKS,
      'readwrite',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(
      DATABASE_STORE_NAMES.BOOKMARKS,
    )

    store.put(bookmark)

    await transactionCompleted
  }

  async findById(
    bookmarkId: BookmarkId,
  ): Promise<Bookmark | null> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.BOOKMARKS,
      'readonly',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(
      DATABASE_STORE_NAMES.BOOKMARKS,
    )

    const bookmark = await requestToPromise(
      store.get(bookmarkId) as IDBRequest<Bookmark | undefined>,
    )

    await transactionCompleted

    return bookmark ?? null
  }

  async findByBookId(
    bookId: BookId,
  ): Promise<readonly Bookmark[]> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.BOOKMARKS,
      'readonly',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(
      DATABASE_STORE_NAMES.BOOKMARKS,
    )
    const index = store.index(
      DATABASE_INDEX_NAMES.BOOKMARKS.BY_BOOK_ID,
    )

    const bookmarks = await requestToPromise(
      index.getAll(bookId) as IDBRequest<Bookmark[]>,
    )

    await transactionCompleted

    return bookmarks
  }

  async findByBookAndPage(
    bookId: BookId,
    pageNumber: number,
  ): Promise<Bookmark | null> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.BOOKMARKS,
      'readonly',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(
      DATABASE_STORE_NAMES.BOOKMARKS,
    )
    const index = store.index(
      DATABASE_INDEX_NAMES.BOOKMARKS.BY_BOOK_AND_PAGE,
    )

    const bookmark = await requestToPromise(
      index.get([
        bookId,
        pageNumber,
      ]) as IDBRequest<Bookmark | undefined>,
    )

    await transactionCompleted

    return bookmark ?? null
  }

  async deleteById(bookmarkId: BookmarkId): Promise<void> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.BOOKMARKS,
      'readwrite',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(
      DATABASE_STORE_NAMES.BOOKMARKS,
    )

    store.delete(bookmarkId)

    await transactionCompleted
  }

  async deleteByBookId(bookId: BookId): Promise<void> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.BOOKMARKS,
      'readwrite',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(
      DATABASE_STORE_NAMES.BOOKMARKS,
    )
    const index = store.index(
      DATABASE_INDEX_NAMES.BOOKMARKS.BY_BOOK_ID,
    )

    const cursorRequest = index.openKeyCursor(
      IDBKeyRange.only(bookId),
    )

    cursorRequest.addEventListener('success', () => {
      const cursor = cursorRequest.result

      if (cursor === null) {
        return
      }

      store.delete(cursor.primaryKey)
      cursor.continue()
    })

    await transactionCompleted
  }
}
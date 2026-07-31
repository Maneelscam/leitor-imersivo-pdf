import { DATABASE_STORE_NAMES } from '@/database/stores/databaseStoreNames'
import { getIndexedDbConnection } from '@/database/indexedDbConnection'
import {
  requestToPromise,
  transactionToPromise,
} from '@/database/indexedDbPromises'
import type { BookCover } from '@/models/entities/BookCover'
import type { BookId } from '@/models/value-objects/BookId'
import type { BookCoverRepository } from '@/repositories/contracts/BookCoverRepository'

export class IndexedDbBookCoverRepository
  implements BookCoverRepository
{
  async save(bookCover: BookCover): Promise<void> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.BOOK_COVERS,
      'readwrite',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(
      DATABASE_STORE_NAMES.BOOK_COVERS,
    )

    store.put(bookCover)

    await transactionCompleted
  }

  async findByBookId(bookId: BookId): Promise<BookCover | null> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.BOOK_COVERS,
      'readonly',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(
      DATABASE_STORE_NAMES.BOOK_COVERS,
    )

    const bookCover = await requestToPromise(
      store.get(bookId) as IDBRequest<BookCover | undefined>,
    )

    await transactionCompleted

    return bookCover ?? null
  }

  async deleteByBookId(bookId: BookId): Promise<void> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.BOOK_COVERS,
      'readwrite',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(
      DATABASE_STORE_NAMES.BOOK_COVERS,
    )

    store.delete(bookId)

    await transactionCompleted
  }
}
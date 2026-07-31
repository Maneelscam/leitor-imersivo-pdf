import { DATABASE_STORE_NAMES } from '@/database/stores/databaseStoreNames'
import { getIndexedDbConnection } from '@/database/indexedDbConnection'
import {
  requestToPromise,
  transactionToPromise,
} from '@/database/indexedDbPromises'
import type { BookFile } from '@/models/entities/BookFile'
import type { BookId } from '@/models/value-objects/BookId'
import type { BookFileRepository } from '@/repositories/contracts/BookFileRepository'

export class IndexedDbBookFileRepository
  implements BookFileRepository
{
  async save(bookFile: BookFile): Promise<void> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.BOOK_FILES,
      'readwrite',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(
      DATABASE_STORE_NAMES.BOOK_FILES,
    )

    store.put(bookFile)

    await transactionCompleted
  }

  async findByBookId(bookId: BookId): Promise<BookFile | null> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.BOOK_FILES,
      'readonly',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(
      DATABASE_STORE_NAMES.BOOK_FILES,
    )

    const bookFile = await requestToPromise(
      store.get(bookId) as IDBRequest<BookFile | undefined>,
    )

    await transactionCompleted

    return bookFile ?? null
  }

  async deleteByBookId(bookId: BookId): Promise<void> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.BOOK_FILES,
      'readwrite',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(
      DATABASE_STORE_NAMES.BOOK_FILES,
    )

    store.delete(bookId)

    await transactionCompleted
  }
}
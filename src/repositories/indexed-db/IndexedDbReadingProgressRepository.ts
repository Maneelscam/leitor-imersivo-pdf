import { getIndexedDbConnection } from '@/database/indexedDbConnection'
import {
  requestToPromise,
  transactionToPromise,
} from '@/database/indexedDbPromises'
import { DATABASE_STORE_NAMES } from '@/database/stores/databaseStoreNames'
import type { ReadingProgress } from '@/models/entities/ReadingProgress'
import type { BookId } from '@/models/value-objects/BookId'
import type { ReadingProgressRepository } from '@/repositories/contracts/ReadingProgressRepository'

export class IndexedDbReadingProgressRepository
  implements ReadingProgressRepository
{
  async save(readingProgress: ReadingProgress): Promise<void> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.READING_PROGRESS,
      'readwrite',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(
      DATABASE_STORE_NAMES.READING_PROGRESS,
    )

    store.put(readingProgress)

    await transactionCompleted
  }

  async findByBookId(
    bookId: BookId,
  ): Promise<ReadingProgress | null> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.READING_PROGRESS,
      'readonly',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(
      DATABASE_STORE_NAMES.READING_PROGRESS,
    )

    const readingProgress = await requestToPromise(
      store.get(bookId) as IDBRequest<ReadingProgress | undefined>,
    )

    await transactionCompleted

    return readingProgress ?? null
  }

  async deleteByBookId(bookId: BookId): Promise<void> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.READING_PROGRESS,
      'readwrite',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(
      DATABASE_STORE_NAMES.READING_PROGRESS,
    )

    store.delete(bookId)

    await transactionCompleted
  }
}
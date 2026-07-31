import { DATABASE_INDEX_NAMES } from '@/database/stores/databaseIndexNames'
import { DATABASE_STORE_NAMES } from '@/database/stores/databaseStoreNames'
import { getIndexedDbConnection } from '@/database/indexedDbConnection'
import {
  requestToPromise,
  transactionToPromise,
} from '@/database/indexedDbPromises'
import type { Book } from '@/models/entities/Book'
import type { BookId } from '@/models/value-objects/BookId'
import type { BookRepository } from '@/repositories/contracts/BookRepository'

export class IndexedDbBookRepository implements BookRepository {
  async save(book: Book): Promise<void> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.BOOKS,
      'readwrite',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(DATABASE_STORE_NAMES.BOOKS)

    store.put(book)

    await transactionCompleted
  }

  async findById(bookId: BookId): Promise<Book | null> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.BOOKS,
      'readonly',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(DATABASE_STORE_NAMES.BOOKS)

    const book = await requestToPromise(
      store.get(bookId) as IDBRequest<Book | undefined>,
    )

    await transactionCompleted

    return book ?? null
  }

  async findByPdfFingerprint(
    pdfFingerprint: string,
  ): Promise<Book | null> {
    const normalizedFingerprint = pdfFingerprint.trim()

    if (normalizedFingerprint.length === 0) {
      return null
    }

    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.BOOKS,
      'readonly',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(DATABASE_STORE_NAMES.BOOKS)
    const index = store.index(
      DATABASE_INDEX_NAMES.BOOKS.BY_PDF_FINGERPRINT,
    )

    const book = await requestToPromise(
      index.get(normalizedFingerprint) as IDBRequest<Book | undefined>,
    )

    await transactionCompleted

    return book ?? null
  }

  async findAll(): Promise<readonly Book[]> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.BOOKS,
      'readonly',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(DATABASE_STORE_NAMES.BOOKS)

    const books = await requestToPromise(
      store.getAll() as IDBRequest<Book[]>,
    )

    await transactionCompleted

    return books
  }

  async deleteById(bookId: BookId): Promise<void> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.BOOKS,
      'readwrite',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(DATABASE_STORE_NAMES.BOOKS)

    store.delete(bookId)

    await transactionCompleted
  }
}
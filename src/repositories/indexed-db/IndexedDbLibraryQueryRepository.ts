import { getIndexedDbConnection } from '@/database/indexedDbConnection'
import {
  requestToPromise,
  transactionToPromise,
} from '@/database/indexedDbPromises'
import { DATABASE_STORE_NAMES } from '@/database/stores/databaseStoreNames'
import type { LibraryBookItem } from '@/models/dtos/LibraryBookItem'
import type { Book } from '@/models/entities/Book'
import type { BookCover } from '@/models/entities/BookCover'
import type { ReadingProgress } from '@/models/entities/ReadingProgress'
import type { BookId } from '@/models/value-objects/BookId'
import type { LibraryQueryRepository } from '@/repositories/contracts/LibraryQueryRepository'

function createCoverMap(
  covers: readonly BookCover[],
): ReadonlyMap<BookId, BookCover> {
  return new Map(
    covers.map((cover) => [
      cover.bookId,
      cover,
    ]),
  )
}

function createReadingProgressMap(
  readingProgressRecords: readonly ReadingProgress[],
): ReadonlyMap<BookId, ReadingProgress> {
  return new Map(
    readingProgressRecords.map((readingProgress) => [
      readingProgress.bookId,
      readingProgress,
    ]),
  )
}

export class IndexedDbLibraryQueryRepository
  implements LibraryQueryRepository
{
  async findAllItems(): Promise<readonly LibraryBookItem[]> {
    const database = await getIndexedDbConnection()

    const transaction = database.transaction(
      [
        DATABASE_STORE_NAMES.BOOKS,
        DATABASE_STORE_NAMES.BOOK_COVERS,
        DATABASE_STORE_NAMES.READING_PROGRESS,
      ],
      'readonly',
    )

    const transactionCompleted = transactionToPromise(transaction)

    const booksStore = transaction.objectStore(
      DATABASE_STORE_NAMES.BOOKS,
    )

    const bookCoversStore = transaction.objectStore(
      DATABASE_STORE_NAMES.BOOK_COVERS,
    )

    const readingProgressStore = transaction.objectStore(
      DATABASE_STORE_NAMES.READING_PROGRESS,
    )

    const booksRequest = requestToPromise(
      booksStore.getAll() as IDBRequest<Book[]>,
    )

    const coversRequest = requestToPromise(
      bookCoversStore.getAll() as IDBRequest<BookCover[]>,
    )

    const readingProgressRequest = requestToPromise(
      readingProgressStore.getAll() as IDBRequest<
        ReadingProgress[]
      >,
    )

    const [
      books,
      covers,
      readingProgressRecords,
    ] = await Promise.all([
      booksRequest,
      coversRequest,
      readingProgressRequest,
      transactionCompleted,
    ])

    const coverMap = createCoverMap(covers)

    const readingProgressMap = createReadingProgressMap(
      readingProgressRecords,
    )

    return books.map((book) => ({
      book,
      cover: coverMap.get(book.id) ?? null,
      readingProgress:
        readingProgressMap.get(book.id) ?? null,
    }))
  }

  async findItemByBookId(
    bookId: BookId,
  ): Promise<LibraryBookItem | null> {
    const database = await getIndexedDbConnection()

    const transaction = database.transaction(
      [
        DATABASE_STORE_NAMES.BOOKS,
        DATABASE_STORE_NAMES.BOOK_COVERS,
        DATABASE_STORE_NAMES.READING_PROGRESS,
      ],
      'readonly',
    )

    const transactionCompleted = transactionToPromise(transaction)

    const booksStore = transaction.objectStore(
      DATABASE_STORE_NAMES.BOOKS,
    )

    const bookCoversStore = transaction.objectStore(
      DATABASE_STORE_NAMES.BOOK_COVERS,
    )

    const readingProgressStore = transaction.objectStore(
      DATABASE_STORE_NAMES.READING_PROGRESS,
    )

    const bookRequest = requestToPromise(
      booksStore.get(bookId) as IDBRequest<Book | undefined>,
    )

    const coverRequest = requestToPromise(
      bookCoversStore.get(bookId) as IDBRequest<
        BookCover | undefined
      >,
    )

    const readingProgressRequest = requestToPromise(
      readingProgressStore.get(bookId) as IDBRequest<
        ReadingProgress | undefined
      >,
    )

    const [
      book,
      cover,
      readingProgress,
    ] = await Promise.all([
      bookRequest,
      coverRequest,
      readingProgressRequest,
      transactionCompleted,
    ])

    if (book === undefined) {
      return null
    }

    return {
      book,
      cover: cover ?? null,
      readingProgress: readingProgress ?? null,
    }
  }
}
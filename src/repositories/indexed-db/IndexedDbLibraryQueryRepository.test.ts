import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'

import { APP_CONFIG } from '@/app/config/app.config'
import { closeIndexedDbConnection } from '@/database/indexedDbConnection'
import type { Book } from '@/models/entities/Book'
import type { BookCover } from '@/models/entities/BookCover'
import type { ReadingProgress } from '@/models/entities/ReadingProgress'
import type { BookId } from '@/models/value-objects/BookId'
import type { IsoDateTime } from '@/models/value-objects/IsoDateTime'
import { IndexedDbBookCoverRepository } from '@/repositories/indexed-db/IndexedDbBookCoverRepository'
import { IndexedDbBookRepository } from '@/repositories/indexed-db/IndexedDbBookRepository'
import { IndexedDbLibraryQueryRepository } from '@/repositories/indexed-db/IndexedDbLibraryQueryRepository'
import { IndexedDbReadingProgressRepository } from '@/repositories/indexed-db/IndexedDbReadingProgressRepository'

const FIRST_BOOK_ID = 'library-book-1' as BookId
const SECOND_BOOK_ID = 'library-book-2' as BookId
const MISSING_BOOK_ID = 'library-book-missing' as BookId

const FIRST_DATE =
  '2026-08-11T14:00:00.000Z' as IsoDateTime

const SECOND_DATE =
  '2026-08-11T15:00:00.000Z' as IsoDateTime

function deleteTestDatabase(): Promise<void> {
  closeIndexedDbConnection()

  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(
      APP_CONFIG.database.name,
    )

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject(
        request.error ??
          new Error(
            'Não foi possível excluir o banco de teste.',
          ),
      )
    }

    request.onblocked = () => {
      reject(
        new Error(
          'A exclusão do banco de teste foi bloqueada.',
        ),
      )
    }
  })
}

function createBook({
  id,
  title,
  updatedAt = FIRST_DATE,
}: {
  readonly id: BookId
  readonly title: string
  readonly updatedAt?: IsoDateTime
}): Book {
  return {
    id,
    title,
    author: null,
    originalFileName: `${title}.pdf`,
    fileSizeBytes: 1024,
    mimeType: 'application/pdf',
    totalPages: 100,
    pdfFingerprint: `fingerprint-${String(id)}`,
    importedAt: FIRST_DATE,
    updatedAt,
    lastOpenedAt: null,
  }
}

function createCover(
  bookId: BookId,
  generatedAt: IsoDateTime = FIRST_DATE,
): BookCover {
  return {
    bookId,
    image: new Blob(
      [`cover-${String(bookId)}`],
      {
        type: 'image/webp',
      },
    ),
    mimeType: 'image/webp',
    width: 800,
    height: 1200,
    generatedAt,
  }
}

function createReadingProgress(
  bookId: BookId,
  currentPage: number,
  updatedAt: IsoDateTime = FIRST_DATE,
): ReadingProgress {
  return {
    bookId,
    currentPage,
    pageOffsetRatio: 0.25,
    updatedAt,
  }
}

describe(
  'IndexedDbLibraryQueryRepository',
  () => {
    beforeEach(
      async () => {
        await deleteTestDatabase()
      },
    )

    afterEach(
      async () => {
        await deleteTestDatabase()
      },
    )

    it(
      'retorna uma lista vazia quando a biblioteca não possui livros',
      async () => {
        const repository =
          new IndexedDbLibraryQueryRepository()

        expect(
          await repository.findAllItems(),
        ).toEqual([])
      },
    )

    it(
      'combina livro, capa e progresso de leitura no item da biblioteca',
      async () => {
        const bookRepository =
          new IndexedDbBookRepository()

        const coverRepository =
          new IndexedDbBookCoverRepository()

        const progressRepository =
          new IndexedDbReadingProgressRepository()

        const queryRepository =
          new IndexedDbLibraryQueryRepository()

        const book =
          createBook({
            id: FIRST_BOOK_ID,
            title: 'Livro completo',
          })

        const cover =
          createCover(
            FIRST_BOOK_ID,
          )

        const readingProgress =
          createReadingProgress(
            FIRST_BOOK_ID,
            37,
          )

        await bookRepository.save(book)
        await coverRepository.save(cover)
        await progressRepository.save(
          readingProgress,
        )

        const items =
          await queryRepository.findAllItems()

        expect(items).toHaveLength(1)
        expect(items[0]?.book).toEqual(book)
        expect(items[0]?.cover?.bookId).toBe(FIRST_BOOK_ID)
        expect(items[0]?.cover?.width).toBe(800)
        expect(items[0]?.readingProgress).toEqual(readingProgress)
      },
    )

    it(
      'usa null para capa e progresso ausentes',
      async () => {
        const bookRepository =
          new IndexedDbBookRepository()

        const queryRepository =
          new IndexedDbLibraryQueryRepository()

        const book =
          createBook({
            id: FIRST_BOOK_ID,
            title: 'Livro sem complementos',
          })

        await bookRepository.save(book)

        const items =
          await queryRepository.findAllItems()

        expect(items).toEqual([
          {
            book,
            cover: null,
            readingProgress: null,
          },
        ])
      },
    )

    it(
      'associa corretamente os dados complementares de livros diferentes',
      async () => {
        const bookRepository =
          new IndexedDbBookRepository()

        const coverRepository =
          new IndexedDbBookCoverRepository()

        const progressRepository =
          new IndexedDbReadingProgressRepository()

        const queryRepository =
          new IndexedDbLibraryQueryRepository()

        const firstBook =
          createBook({
            id: FIRST_BOOK_ID,
            title: 'Primeiro livro',
          })

        const secondBook =
          createBook({
            id: SECOND_BOOK_ID,
            title: 'Segundo livro',
            updatedAt: SECOND_DATE,
          })

        const secondCover =
          createCover(
            SECOND_BOOK_ID,
            SECOND_DATE,
          )

        const firstProgress =
          createReadingProgress(
            FIRST_BOOK_ID,
            12,
          )

        await bookRepository.save(firstBook)
        await bookRepository.save(secondBook)
        await coverRepository.save(secondCover)
        await progressRepository.save(firstProgress)

        const items =
          await queryRepository.findAllItems()

        const firstItem =
          items.find(
            (item) =>
              item.book.id === FIRST_BOOK_ID,
          )

        const secondItem =
          items.find(
            (item) =>
              item.book.id === SECOND_BOOK_ID,
          )

        expect(firstItem).toEqual({
          book: firstBook,
          cover: null,
          readingProgress: firstProgress,
        })

        expect(secondItem?.book).toEqual(secondBook)
        expect(secondItem?.cover?.bookId).toBe(SECOND_BOOK_ID)
        expect(secondItem?.readingProgress).toBeNull()
      },
    )

    it(
      'ignora capa e progresso órfãos ao listar a biblioteca',
      async () => {
        const coverRepository =
          new IndexedDbBookCoverRepository()

        const progressRepository =
          new IndexedDbReadingProgressRepository()

        const queryRepository =
          new IndexedDbLibraryQueryRepository()

        await coverRepository.save(
          createCover(MISSING_BOOK_ID),
        )

        await progressRepository.save(
          createReadingProgress(
            MISSING_BOOK_ID,
            50,
          ),
        )

        expect(
          await queryRepository.findAllItems(),
        ).toEqual([])
      },
    )

    it(
      'localiza um item completo pelo identificador do livro',
      async () => {
        const bookRepository =
          new IndexedDbBookRepository()

        const coverRepository =
          new IndexedDbBookCoverRepository()

        const progressRepository =
          new IndexedDbReadingProgressRepository()

        const queryRepository =
          new IndexedDbLibraryQueryRepository()

        const book =
          createBook({
            id: FIRST_BOOK_ID,
            title: 'Livro localizado',
          })

        const cover =
          createCover(FIRST_BOOK_ID)

        const readingProgress =
          createReadingProgress(
            FIRST_BOOK_ID,
            72,
          )

        await bookRepository.save(book)
        await coverRepository.save(cover)
        await progressRepository.save(readingProgress)

        const item =
          await queryRepository.findItemByBookId(
            FIRST_BOOK_ID,
          )

        expect(item?.book).toEqual(book)
        expect(item?.cover?.bookId).toBe(FIRST_BOOK_ID)
        expect(item?.readingProgress).toEqual(readingProgress)
      },
    )

    it(
      'retorna o livro com complementos null quando eles não existem',
      async () => {
        const bookRepository =
          new IndexedDbBookRepository()

        const queryRepository =
          new IndexedDbLibraryQueryRepository()

        const book =
          createBook({
            id: FIRST_BOOK_ID,
            title: 'Livro isolado',
          })

        await bookRepository.save(book)

        expect(
          await queryRepository.findItemByBookId(
            FIRST_BOOK_ID,
          ),
        ).toEqual({
          book,
          cover: null,
          readingProgress: null,
        })
      },
    )

    it(
      'retorna null quando o livro não existe, mesmo com dados órfãos',
      async () => {
        const coverRepository =
          new IndexedDbBookCoverRepository()

        const progressRepository =
          new IndexedDbReadingProgressRepository()

        const queryRepository =
          new IndexedDbLibraryQueryRepository()

        await coverRepository.save(
          createCover(MISSING_BOOK_ID),
        )

        await progressRepository.save(
          createReadingProgress(
            MISSING_BOOK_ID,
            88,
          ),
        )

        expect(
          await queryRepository.findItemByBookId(
            MISSING_BOOK_ID,
          ),
        ).toBeNull()
      },
    )
  },
)
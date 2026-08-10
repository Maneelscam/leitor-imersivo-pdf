import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'

import {
  APP_CONFIG,
} from '@/app/config/app.config'
import {
  closeIndexedDbConnection,
} from '@/database/indexedDbConnection'
import type {
  ReadingProgress,
} from '@/models/entities/ReadingProgress'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  IsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import {
  IndexedDbReadingProgressRepository,
} from '@/repositories/indexed-db/IndexedDbReadingProgressRepository'

const FIRST_BOOK_ID =
  'livro-progresso-1' as BookId

const SECOND_BOOK_ID =
  'livro-progresso-2' as BookId

const TEST_DATE =
  '2026-08-10T16:00:00.000Z' as IsoDateTime

const UPDATED_DATE =
  '2026-08-10T16:30:00.000Z' as IsoDateTime

function deleteTestDatabase():
  Promise<void> {
  closeIndexedDbConnection()

  return new Promise<void>(
    (resolve, reject) => {
      const request =
        indexedDB.deleteDatabase(
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
    },
  )
}

function createReadingProgress({
  bookId,
  currentPage,
  pageOffsetRatio,
  updatedAt = TEST_DATE,
}: {
  readonly bookId: BookId
  readonly currentPage: number
  readonly pageOffsetRatio: number
  readonly updatedAt?: IsoDateTime
}): ReadingProgress {
  return {
    bookId,
    currentPage,
    pageOffsetRatio,
    updatedAt,
  }
}

describe(
  'IndexedDbReadingProgressRepository',
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
      'salva e recupera o progresso de leitura pelo livro',
      async () => {
        const repository =
          new IndexedDbReadingProgressRepository()

        const readingProgress =
          createReadingProgress({
            bookId:
              FIRST_BOOK_ID,

            currentPage: 12,

            pageOffsetRatio: 0.35,
          })

        await repository.save(
          readingProgress,
        )

        const restoredProgress =
          await repository.findByBookId(
            FIRST_BOOK_ID,
          )

        expect(
          restoredProgress,
        ).toEqual(
          readingProgress,
        )
      },
    )

    it(
      'retorna null quando o livro não possui progresso salvo',
      async () => {
        const repository =
          new IndexedDbReadingProgressRepository()

        const restoredProgress =
          await repository.findByBookId(
            FIRST_BOOK_ID,
          )

        expect(
          restoredProgress,
        ).toBeNull()
      },
    )

    it(
      'atualiza o progresso existente ao salvar o mesmo livro',
      async () => {
        const repository =
          new IndexedDbReadingProgressRepository()

        const originalProgress =
          createReadingProgress({
            bookId:
              FIRST_BOOK_ID,

            currentPage: 4,

            pageOffsetRatio: 0.2,
          })

        await repository.save(
          originalProgress,
        )

        const updatedProgress:
          ReadingProgress = {
            ...originalProgress,

            currentPage: 18,

            pageOffsetRatio: 0.75,

            updatedAt:
              UPDATED_DATE,
          }

        await repository.save(
          updatedProgress,
        )

        const restoredProgress =
          await repository.findByBookId(
            FIRST_BOOK_ID,
          )

        expect(
          restoredProgress,
        ).toEqual(
          updatedProgress,
        )
      },
    )

    it(
      'mantém progressos independentes para livros diferentes',
      async () => {
        const repository =
          new IndexedDbReadingProgressRepository()

        const firstBookProgress =
          createReadingProgress({
            bookId:
              FIRST_BOOK_ID,

            currentPage: 6,

            pageOffsetRatio: 0.1,
          })

        const secondBookProgress =
          createReadingProgress({
            bookId:
              SECOND_BOOK_ID,

            currentPage: 21,

            pageOffsetRatio: 0.65,

            updatedAt:
              UPDATED_DATE,
          })

        await repository.save(
          firstBookProgress,
        )

        await repository.save(
          secondBookProgress,
        )

        const restoredFirstProgress =
          await repository.findByBookId(
            FIRST_BOOK_ID,
          )

        const restoredSecondProgress =
          await repository.findByBookId(
            SECOND_BOOK_ID,
          )

        expect(
          restoredFirstProgress,
        ).toEqual(
          firstBookProgress,
        )

        expect(
          restoredSecondProgress,
        ).toEqual(
          secondBookProgress,
        )
      },
    )

    it(
      'exclui somente o progresso do livro solicitado',
      async () => {
        const repository =
          new IndexedDbReadingProgressRepository()

        const deletedProgress =
          createReadingProgress({
            bookId:
              FIRST_BOOK_ID,

            currentPage: 8,

            pageOffsetRatio: 0.4,
          })

        const preservedProgress =
          createReadingProgress({
            bookId:
              SECOND_BOOK_ID,

            currentPage: 15,

            pageOffsetRatio: 0.55,

            updatedAt:
              UPDATED_DATE,
          })

        await repository.save(
          deletedProgress,
        )

        await repository.save(
          preservedProgress,
        )

        await repository.deleteByBookId(
          FIRST_BOOK_ID,
        )

        const deletedBookProgress =
          await repository.findByBookId(
            FIRST_BOOK_ID,
          )

        const preservedBookProgress =
          await repository.findByBookId(
            SECOND_BOOK_ID,
          )

        expect(
          deletedBookProgress,
        ).toBeNull()

        expect(
          preservedBookProgress,
        ).toEqual(
          preservedProgress,
        )
      },
    )
  },
)
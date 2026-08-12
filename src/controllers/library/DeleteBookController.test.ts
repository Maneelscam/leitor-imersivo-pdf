import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  DeleteBookController,
} from '@/controllers/library/DeleteBookController'
import type {
  Book,
} from '@/models/entities/Book'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  IsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import type {
  BookRepository,
} from '@/repositories/contracts/BookRepository'
import type {
  LibraryTransactionRepository,
} from '@/repositories/contracts/LibraryTransactionRepository'
import {
  LibraryError,
  LibraryErrorCode,
} from '@/utils/errors/LibraryError'

const BOOK_ID =
  'book-to-delete' as BookId

const IMPORTED_AT =
  '2026-08-11T16:00:00.000Z' as IsoDateTime

function createBook(): Book {
  return {
    id: BOOK_ID,
    title: 'Livro para excluir',
    author: null,
    originalFileName:
      'livro-para-excluir.pdf',
    fileSizeBytes: 2048,
    mimeType: 'application/pdf',
    totalPages: 42,
    pdfFingerprint:
      'fingerprint-book-to-delete',
    importedAt: IMPORTED_AT,
    updatedAt: IMPORTED_AT,
    lastOpenedAt: null,
  }
}

function createDependencies({
  foundBook = createBook(),
}: {
  readonly foundBook?: Book | null
} = {}): {
  readonly bookRepository: BookRepository
  readonly libraryTransactionRepository:
    LibraryTransactionRepository
} {
  return {
    bookRepository: {
      save: vi.fn(),
      findById:
        vi.fn().mockResolvedValue(
          foundBook,
        ),
      findByPdfFingerprint:
        vi.fn(),
      findAll: vi.fn(),
      deleteById: vi.fn(),
    },

    libraryTransactionRepository: {
      saveImportedBook: vi.fn(),
      deleteBookCompletely:
        vi.fn().mockResolvedValue(
          undefined,
        ),
    },
  }
}

describe(
  'DeleteBookController',
  () => {
    it(
      'exclui completamente o livro e retorna o livro removido',
      async () => {
        const dependencies =
          createDependencies()

        const controller =
          new DeleteBookController(
            dependencies,
          )

        const result =
          await controller.execute({
            bookId: BOOK_ID,
          })

        expect(
          dependencies.bookRepository
            .findById,
        ).toHaveBeenCalledWith(
          BOOK_ID,
        )

        expect(
          dependencies
            .libraryTransactionRepository
            .deleteBookCompletely,
        ).toHaveBeenCalledWith(
          BOOK_ID,
        )

        expect(result).toEqual(
          createBook(),
        )
      },
    )

    it(
      'retorna BOOK_NOT_FOUND quando o livro não existe',
      async () => {
        const dependencies =
          createDependencies({
            foundBook: null,
          })

        const controller =
          new DeleteBookController(
            dependencies,
          )

        const executePromise =
          controller.execute({
            bookId: BOOK_ID,
          })

        await expect(
          executePromise,
        ).rejects.toMatchObject({
          name: 'LibraryError',
          code:
            LibraryErrorCode.BOOK_NOT_FOUND,
        })

        expect(
          dependencies
            .libraryTransactionRepository
            .deleteBookCompletely,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'converte falha ao consultar o livro em DELETE_FAILED',
      async () => {
        const dependencies =
          createDependencies()

        const lookupError =
          new Error(
            'falha de consulta',
          )

        vi.mocked(
          dependencies.bookRepository
            .findById,
        ).mockRejectedValue(
          lookupError,
        )

        const controller =
          new DeleteBookController(
            dependencies,
          )

        try {
          await controller.execute({
            bookId: BOOK_ID,
          })

          throw new Error(
            'A execução deveria falhar.',
          )
        } catch (error) {
          expect(
            error,
          ).toBeInstanceOf(
            LibraryError,
          )

          expect(
            error,
          ).toMatchObject({
            code:
              LibraryErrorCode.DELETE_FAILED,
            cause: lookupError,
          })
        }

        expect(
          dependencies
            .libraryTransactionRepository
            .deleteBookCompletely,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'converte falha da exclusão transacional em DELETE_FAILED',
      async () => {
        const dependencies =
          createDependencies()

        const deletionError =
          new Error(
            'falha de exclusão',
          )

        vi.mocked(
          dependencies
            .libraryTransactionRepository
            .deleteBookCompletely,
        ).mockRejectedValue(
          deletionError,
        )

        const controller =
          new DeleteBookController(
            dependencies,
          )

        try {
          await controller.execute({
            bookId: BOOK_ID,
          })

          throw new Error(
            'A execução deveria falhar.',
          )
        } catch (error) {
          expect(
            error,
          ).toBeInstanceOf(
            LibraryError,
          )

          expect(
            error,
          ).toMatchObject({
            code:
              LibraryErrorCode.DELETE_FAILED,
            cause: deletionError,
          })
        }
      },
    )
  },
)
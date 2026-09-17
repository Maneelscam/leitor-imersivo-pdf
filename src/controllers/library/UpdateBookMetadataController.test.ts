import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  UpdateBookMetadataController,
} from '@/controllers/library/UpdateBookMetadataController'
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
import {
  LibraryError,
  LibraryErrorCode,
} from '@/utils/errors/LibraryError'

const BOOK_ID =
  'book-metadata-test' as BookId

const IMPORTED_AT =
  '2026-08-11T16:00:00.000Z' as
    IsoDateTime

function createBook(): Book {
  return {
    id: BOOK_ID,
    title: 'Título original',
    author: 'Autor original',
    originalFileName:
      'arquivo-original.pdf',
    fileSizeBytes: 4096,
    mimeType: 'application/pdf',
    totalPages: 120,
    pdfFingerprint:
      'fingerprint-metadata-test',
    importedAt: IMPORTED_AT,
    updatedAt: IMPORTED_AT,
    lastOpenedAt: null,
  }
}

function createRepository(
  foundBook: Book | null =
    createBook(),
): BookRepository {
  return {
    save:
      vi.fn().mockResolvedValue(
        undefined,
      ),
    findById:
      vi.fn().mockResolvedValue(
        foundBook,
      ),
    findByPdfFingerprint:
      vi.fn(),
    findAll:
      vi.fn(),
    deleteById:
      vi.fn(),
  }
}

describe(
  'UpdateBookMetadataController',
  () => {
    it(
      'atualiza apenas título, autor e updatedAt',
      async () => {
        const originalBook =
          createBook()

        const repository =
          createRepository(
            originalBook,
          )

        const controller =
          new UpdateBookMetadataController(
            repository,
          )

        const result =
          await controller.execute({
            bookId: BOOK_ID,
            title:
              'Novo título',
            author:
              'Novo autor',
          })

        expect(result).toMatchObject({
          id:
            originalBook.id,
          title:
            'Novo título',
          author:
            'Novo autor',
          originalFileName:
            originalBook.originalFileName,
          fileSizeBytes:
            originalBook.fileSizeBytes,
          mimeType:
            originalBook.mimeType,
          totalPages:
            originalBook.totalPages,
          pdfFingerprint:
            originalBook.pdfFingerprint,
          importedAt:
            originalBook.importedAt,
          lastOpenedAt:
            originalBook.lastOpenedAt,
        })

        expect(
          result.updatedAt,
        ).not.toBe(
          IMPORTED_AT,
        )

        expect(
          repository.save,
        ).toHaveBeenCalledWith(
          result,
        )

        expect(
          result.originalFileName,
        ).toBe(
          originalBook.originalFileName,
        )

        expect(
          result.pdfFingerprint,
        ).toBe(
          originalBook.pdfFingerprint,
        )
      },
    )

    it(
      'normaliza espaços e converte autor vazio em null',
      async () => {
        const repository =
          createRepository()

        const controller =
          new UpdateBookMetadataController(
            repository,
          )

        const result =
          await controller.execute({
            bookId: BOOK_ID,
            title:
              '  Um   título   limpo  ',
            author:
              '   ',
          })

        expect(result.title).toBe(
          'Um título limpo',
        )

        expect(result.author).toBeNull()
      },
    )

    it(
      'rejeita título vazio sem consultar nem salvar',
      async () => {
        const repository =
          createRepository()

        const controller =
          new UpdateBookMetadataController(
            repository,
          )

        await expect(
          controller.execute({
            bookId: BOOK_ID,
            title:
              '   ',
            author:
              null,
          }),
        ).rejects.toMatchObject({
          name:
            'LibraryError',
          code:
            LibraryErrorCode.UPDATE_FAILED,
        })

        expect(
          repository.findById,
        ).not.toHaveBeenCalled()

        expect(
          repository.save,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'retorna BOOK_NOT_FOUND quando o livro não existe',
      async () => {
        const repository =
          createRepository(null)

        const controller =
          new UpdateBookMetadataController(
            repository,
          )

        await expect(
          controller.execute({
            bookId: BOOK_ID,
            title:
              'Novo título',
            author:
              null,
          }),
        ).rejects.toMatchObject({
          name:
            'LibraryError',
          code:
            LibraryErrorCode.BOOK_NOT_FOUND,
        })

        expect(
          repository.save,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'não grava novamente quando os valores normalizados não mudaram',
      async () => {
        const repository =
          createRepository()

        const controller =
          new UpdateBookMetadataController(
            repository,
          )

        const result =
          await controller.execute({
            bookId: BOOK_ID,
            title:
              '  Título   original ',
            author:
              ' Autor   original ',
          })

        expect(result).toEqual(
          createBook(),
        )

        expect(
          repository.save,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'converte falha de persistência em UPDATE_FAILED',
      async () => {
        const repository =
          createRepository()

        const storageError =
          new Error(
            'falha de armazenamento',
          )

        vi.mocked(
          repository.save,
        ).mockRejectedValue(
          storageError,
        )

        const controller =
          new UpdateBookMetadataController(
            repository,
          )

        try {
          await controller.execute({
            bookId: BOOK_ID,
            title:
              'Novo título',
            author:
              'Novo autor',
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

          expect(error).toMatchObject({
            code:
              LibraryErrorCode.UPDATE_FAILED,
            cause:
              storageError,
          })
        }
      },
    )
  },
)

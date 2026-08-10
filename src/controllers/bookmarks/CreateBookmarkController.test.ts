import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  CreateBookmarkController,
} from '@/controllers/bookmarks/CreateBookmarkController'
import type {
  Bookmark,
} from '@/models/entities/Bookmark'
import type {
  BookmarkId,
} from '@/models/value-objects/BookmarkId'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  IsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import type {
  BookmarkRepository,
} from '@/repositories/contracts/BookmarkRepository'

const BOOK_ID =
  'create-bookmark-controller-book' as BookId

const EXISTING_BOOKMARK_ID =
  'existing-bookmark' as BookmarkId

const EXISTING_DATE =
  '2026-08-10T12:00:00.000Z' as IsoDateTime

function createExistingBookmark(
  pageNumber = 5,
  pageOffsetRatio = 0.4,
): Bookmark {
  return {
    id:
      EXISTING_BOOKMARK_ID,

    bookId:
      BOOK_ID,

    pageNumber,
    pageOffsetRatio,

    createdAt:
      EXISTING_DATE,
  }
}

describe(
  'CreateBookmarkController',
  () => {
    let repository:
      BookmarkRepository

    let controller:
      CreateBookmarkController

    beforeEach(
      () => {
        repository = {
          save:
            vi.fn(),

          findById:
            vi.fn(),

          findByBookId:
            vi.fn(),

          findByBookAndPage:
            vi.fn(),

          deleteById:
            vi.fn(),

          deleteByBookId:
            vi.fn(),
        }

        controller =
          new CreateBookmarkController(
            repository,
          )
      },
    )

    it(
      'cria e salva um novo favorito',
      async () => {
        vi.mocked(
          repository.findByBookAndPage,
        )
          .mockResolvedValue(
            null,
          )

        vi.mocked(
          repository.save,
        )
          .mockResolvedValue(
            undefined,
          )

        const result =
          await controller.execute({
            bookId:
              BOOK_ID,

            pageNumber:
              5,

            pageOffsetRatio:
              0.4,
          })

        expect(
          repository.findByBookAndPage,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          repository.findByBookAndPage,
        ).toHaveBeenCalledWith(
          BOOK_ID,
          5,
        )

        expect(
          repository.save,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          result.bookId,
        ).toBe(
          BOOK_ID,
        )

        expect(
          result.pageNumber,
        ).toBe(
          5,
        )

        expect(
          result.pageOffsetRatio,
        ).toBe(
          0.4,
        )

        expect(
          typeof result.id,
        ).toBe(
          'string',
        )

        expect(
          result.id.length,
        ).toBeGreaterThan(
          0,
        )

        expect(
          typeof result.createdAt,
        ).toBe(
          'string',
        )

        expect(
          result.createdAt.length,
        ).toBeGreaterThan(
          0,
        )

        expect(
          repository.save,
        ).toHaveBeenCalledWith(
          result,
        )
      },
    )

    it(
      'retorna favorito existente sem criar outro para a mesma página',
      async () => {
        const existingBookmark =
          createExistingBookmark(
            5,
            0.25,
          )

        vi.mocked(
          repository.findByBookAndPage,
        )
          .mockResolvedValue(
            existingBookmark,
          )

        const result =
          await controller.execute({
            bookId:
              BOOK_ID,

            pageNumber:
              5,

            pageOffsetRatio:
              0.9,
          })

        expect(
          repository.findByBookAndPage,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          repository.findByBookAndPage,
        ).toHaveBeenCalledWith(
          BOOK_ID,
          5,
        )

        expect(
          repository.save,
        ).not.toHaveBeenCalled()

        expect(
          result,
        ).toBe(
          existingBookmark,
        )
      },
    )

    it(
      'normaliza deslocamento negativo para zero',
      async () => {
        vi.mocked(
          repository.findByBookAndPage,
        )
          .mockResolvedValue(
            null,
          )

        const result =
          await controller.execute({
            bookId:
              BOOK_ID,

            pageNumber:
              3,

            pageOffsetRatio:
              -0.75,
          })

        expect(
          result.pageOffsetRatio,
        ).toBe(
          0,
        )

        expect(
          repository.save,
        ).toHaveBeenCalledWith(
          result,
        )
      },
    )

    it(
      'normaliza deslocamento maior que um para um',
      async () => {
        vi.mocked(
          repository.findByBookAndPage,
        )
          .mockResolvedValue(
            null,
          )

        const result =
          await controller.execute({
            bookId:
              BOOK_ID,

            pageNumber:
              3,

            pageOffsetRatio:
              1.75,
          })

        expect(
          result.pageOffsetRatio,
        ).toBe(
          1,
        )

        expect(
          repository.save,
        ).toHaveBeenCalledWith(
          result,
        )
      },
    )

    it(
      'normaliza deslocamento não finito para zero',
      async () => {
        vi.mocked(
          repository.findByBookAndPage,
        )
          .mockResolvedValue(
            null,
          )

        const resultNaN =
          await controller.execute({
            bookId:
              BOOK_ID,

            pageNumber:
              2,

            pageOffsetRatio:
              Number.NaN,
          })

        const resultInfinity =
          await controller.execute({
            bookId:
              BOOK_ID,

            pageNumber:
              3,

            pageOffsetRatio:
              Number.POSITIVE_INFINITY,
          })

        expect(
          resultNaN.pageOffsetRatio,
        ).toBe(
          0,
        )

        expect(
          resultInfinity.pageOffsetRatio,
        ).toBe(
          0,
        )
      },
    )

    it.each([
      0,
      -1,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ])(
      'rejeita número de página inválido: %s',
      async (
        invalidPageNumber,
      ) => {
        await expect(
          controller.execute({
            bookId:
              BOOK_ID,

            pageNumber:
              invalidPageNumber,

            pageOffsetRatio:
              0.5,
          }),
        ).rejects.toThrow()

        expect(
          repository.findByBookAndPage,
        ).not.toHaveBeenCalled()

        expect(
          repository.save,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'propaga erro ao procurar favorito existente',
      async () => {
        const repositoryError =
          new Error(
            'Falha simulada ao procurar favorito.',
          )

        vi.mocked(
          repository.findByBookAndPage,
        )
          .mockRejectedValue(
            repositoryError,
          )

        await expect(
          controller.execute({
            bookId:
              BOOK_ID,

            pageNumber:
              6,

            pageOffsetRatio:
              0.3,
          }),
        ).rejects.toBe(
          repositoryError,
        )

        expect(
          repository.save,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'propaga erro ao salvar novo favorito',
      async () => {
        const repositoryError =
          new Error(
            'Falha simulada ao salvar favorito.',
          )

        vi.mocked(
          repository.findByBookAndPage,
        )
          .mockResolvedValue(
            null,
          )

        vi.mocked(
          repository.save,
        )
          .mockRejectedValue(
            repositoryError,
          )

        await expect(
          controller.execute({
            bookId:
              BOOK_ID,

            pageNumber:
              8,

            pageOffsetRatio:
              0.6,
          }),
        ).rejects.toBe(
          repositoryError,
        )

        expect(
          repository.save,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )
  },
)
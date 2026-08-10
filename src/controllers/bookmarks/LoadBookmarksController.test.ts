import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  LoadBookmarksController,
} from '@/controllers/bookmarks/LoadBookmarksController'
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
  'load-bookmarks-controller-book' as BookId

function createBookmark(
  id: string,
  pageNumber: number,
  pageOffsetRatio: number,
  createdAt: string,
): Bookmark {
  return {
    id:
      id as BookmarkId,

    bookId:
      BOOK_ID,

    pageNumber,
    pageOffsetRatio,

    createdAt:
      createdAt as IsoDateTime,
  }
}

describe(
  'LoadBookmarksController',
  () => {
    let repository:
      BookmarkRepository

    let controller:
      LoadBookmarksController

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
          new LoadBookmarksController(
            repository,
          )
      },
    )

    it(
      'carrega os favoritos do livro informado',
      async () => {
        const bookmarks = [
          createBookmark(
            'bookmark-1',
            2,
            0.2,
            '2026-08-10T10:00:00.000Z',
          ),

          createBookmark(
            'bookmark-2',
            5,
            0.4,
            '2026-08-10T10:01:00.000Z',
          ),
        ]

        vi.mocked(
          repository.findByBookId,
        )
          .mockResolvedValue(
            bookmarks,
          )

        const result =
          await controller.execute(
            BOOK_ID,
          )

        expect(
          repository.findByBookId,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          repository.findByBookId,
        ).toHaveBeenCalledWith(
          BOOK_ID,
        )

        expect(
          result,
        ).toEqual(
          bookmarks,
        )
      },
    )

    it(
      'retorna lista vazia quando o livro não possui favoritos',
      async () => {
        vi.mocked(
          repository.findByBookId,
        )
          .mockResolvedValue(
            [],
          )

        const result =
          await controller.execute(
            BOOK_ID,
          )

        expect(
          result,
        ).toEqual(
          [],
        )
      },
    )

    it(
      'ordena favoritos pela página',
      async () => {
        const page10 =
          createBookmark(
            'bookmark-page-10',
            10,
            0.1,
            '2026-08-10T10:00:00.000Z',
          )

        const page2 =
          createBookmark(
            'bookmark-page-2',
            2,
            0.8,
            '2026-08-10T10:00:00.000Z',
          )

        const page7 =
          createBookmark(
            'bookmark-page-7',
            7,
            0.3,
            '2026-08-10T10:00:00.000Z',
          )

        vi.mocked(
          repository.findByBookId,
        )
          .mockResolvedValue([
            page10,
            page2,
            page7,
          ])

        const result =
          await controller.execute(
            BOOK_ID,
          )

        expect(
          result.map(
            (bookmark) =>
              bookmark.pageNumber,
          ),
        ).toEqual([
          2,
          7,
          10,
        ])
      },
    )

    it(
      'ordena favoritos da mesma página pelo deslocamento',
      async () => {
        const offsetHigh =
          createBookmark(
            'bookmark-offset-high',
            4,
            0.9,
            '2026-08-10T10:00:00.000Z',
          )

        const offsetLow =
          createBookmark(
            'bookmark-offset-low',
            4,
            0.1,
            '2026-08-10T10:00:00.000Z',
          )

        const offsetMiddle =
          createBookmark(
            'bookmark-offset-middle',
            4,
            0.5,
            '2026-08-10T10:00:00.000Z',
          )

        vi.mocked(
          repository.findByBookId,
        )
          .mockResolvedValue([
            offsetHigh,
            offsetLow,
            offsetMiddle,
          ])

        const result =
          await controller.execute(
            BOOK_ID,
          )

        expect(
          result.map(
            (bookmark) =>
              bookmark.pageOffsetRatio,
          ),
        ).toEqual([
          0.1,
          0.5,
          0.9,
        ])
      },
    )

    it(
      'ordena favoritos da mesma posição pela data de criação',
      async () => {
        const newest =
          createBookmark(
            'bookmark-newest',
            4,
            0.5,
            '2026-08-10T12:00:00.000Z',
          )

        const oldest =
          createBookmark(
            'bookmark-oldest',
            4,
            0.5,
            '2026-08-10T08:00:00.000Z',
          )

        const middle =
          createBookmark(
            'bookmark-middle',
            4,
            0.5,
            '2026-08-10T10:00:00.000Z',
          )

        vi.mocked(
          repository.findByBookId,
        )
          .mockResolvedValue([
            newest,
            oldest,
            middle,
          ])

        const result =
          await controller.execute(
            BOOK_ID,
          )

        expect(
          result.map(
            (bookmark) =>
              bookmark.id,
          ),
        ).toEqual([
          oldest.id,
          middle.id,
          newest.id,
        ])
      },
    )

    it(
      'não altera a lista original recebida do repositório',
      async () => {
        const first =
          createBookmark(
            'bookmark-first',
            8,
            0.2,
            '2026-08-10T10:00:00.000Z',
          )

        const second =
          createBookmark(
            'bookmark-second',
            2,
            0.4,
            '2026-08-10T10:00:00.000Z',
          )

        const repositoryResult = [
          first,
          second,
        ]

        vi.mocked(
          repository.findByBookId,
        )
          .mockResolvedValue(
            repositoryResult,
          )

        const result =
          await controller.execute(
            BOOK_ID,
          )

        expect(
          repositoryResult,
        ).toEqual([
          first,
          second,
        ])

        expect(
          result,
        ).not.toBe(
          repositoryResult,
        )

        expect(
          result,
        ).toEqual([
          second,
          first,
        ])
      },
    )

    it(
      'propaga erro do repositório',
      async () => {
        const repositoryError =
          new Error(
            'Falha simulada no repositório.',
          )

        vi.mocked(
          repository.findByBookId,
        )
          .mockRejectedValue(
            repositoryError,
          )

        await expect(
          controller.execute(
            BOOK_ID,
          ),
        ).rejects.toBe(
          repositoryError,
        )
      },
    )
  },
)
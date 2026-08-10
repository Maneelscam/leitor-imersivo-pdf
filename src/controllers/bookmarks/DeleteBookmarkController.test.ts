import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  DeleteBookmarkController,
} from '@/controllers/bookmarks/DeleteBookmarkController'
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
  'delete-bookmark-controller-book' as BookId

const BOOKMARK_ID =
  'delete-bookmark-controller-id' as BookmarkId

const CREATED_AT =
  '2026-08-10T12:00:00.000Z' as IsoDateTime

function createBookmark(): Bookmark {
  return {
    id:
      BOOKMARK_ID,

    bookId:
      BOOK_ID,

    pageNumber:
      5,

    pageOffsetRatio:
      0.4,

    createdAt:
      CREATED_AT,
  }
}

describe(
  'DeleteBookmarkController',
  () => {
    let repository:
      BookmarkRepository

    let controller:
      DeleteBookmarkController

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
          new DeleteBookmarkController(
            repository,
          )
      },
    )

    it(
      'exclui um favorito existente',
      async () => {
        const bookmark =
          createBookmark()

        vi.mocked(
          repository.findById,
        )
          .mockResolvedValue(
            bookmark,
          )

        vi.mocked(
          repository.deleteById,
        )
          .mockResolvedValue(
            undefined,
          )

        await controller.execute(
          BOOKMARK_ID,
        )

        expect(
          repository.findById,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          repository.findById,
        ).toHaveBeenCalledWith(
          BOOKMARK_ID,
        )

        expect(
          repository.deleteById,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          repository.deleteById,
        ).toHaveBeenCalledWith(
          BOOKMARK_ID,
        )
      },
    )

    it(
      'não tenta excluir quando o favorito não existe',
      async () => {
        vi.mocked(
          repository.findById,
        )
          .mockResolvedValue(
            null,
          )

        await controller.execute(
          BOOKMARK_ID,
        )

        expect(
          repository.findById,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          repository.findById,
        ).toHaveBeenCalledWith(
          BOOKMARK_ID,
        )

        expect(
          repository.deleteById,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'propaga erro ao procurar o favorito',
      async () => {
        const repositoryError =
          new Error(
            'Falha simulada ao procurar favorito.',
          )

        vi.mocked(
          repository.findById,
        )
          .mockRejectedValue(
            repositoryError,
          )

        await expect(
          controller.execute(
            BOOKMARK_ID,
          ),
        ).rejects.toBe(
          repositoryError,
        )

        expect(
          repository.deleteById,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'propaga erro ao excluir o favorito',
      async () => {
        const bookmark =
          createBookmark()

        const repositoryError =
          new Error(
            'Falha simulada ao excluir favorito.',
          )

        vi.mocked(
          repository.findById,
        )
          .mockResolvedValue(
            bookmark,
          )

        vi.mocked(
          repository.deleteById,
        )
          .mockRejectedValue(
            repositoryError,
          )

        await expect(
          controller.execute(
            BOOKMARK_ID,
          ),
        ).rejects.toBe(
          repositoryError,
        )

        expect(
          repository.findById,
        ).toHaveBeenCalledWith(
          BOOKMARK_ID,
        )

        expect(
          repository.deleteById,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          repository.deleteById,
        ).toHaveBeenCalledWith(
          BOOKMARK_ID,
        )
      },
    )
  },
)
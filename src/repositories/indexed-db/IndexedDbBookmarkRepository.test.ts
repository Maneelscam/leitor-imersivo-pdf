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
import {
  IndexedDbBookmarkRepository,
} from '@/repositories/indexed-db/IndexedDbBookmarkRepository'

const FIRST_BOOK_ID =
  'livro-favoritos-1' as BookId

const SECOND_BOOK_ID =
  'livro-favoritos-2' as BookId

const FIRST_BOOKMARK_ID =
  'favorito-1' as BookmarkId

const SECOND_BOOKMARK_ID =
  'favorito-2' as BookmarkId

const THIRD_BOOKMARK_ID =
  'favorito-3' as BookmarkId

const TEST_DATE =
  '2026-08-10T14:30:00.000Z' as IsoDateTime

const UPDATED_DATE =
  '2026-08-10T15:00:00.000Z' as IsoDateTime

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

function createBookmark({
  id,
  bookId,
  pageNumber,
  pageOffsetRatio,
  createdAt = TEST_DATE,
}: {
  readonly id: BookmarkId
  readonly bookId: BookId
  readonly pageNumber: number
  readonly pageOffsetRatio: number
  readonly createdAt?: IsoDateTime
}): Bookmark {
  return {
    id,
    bookId,
    pageNumber,
    pageOffsetRatio,
    createdAt,
  }
}

describe(
  'IndexedDbBookmarkRepository',
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
      'salva e recupera um favorito pelo identificador',
      async () => {
        const repository =
          new IndexedDbBookmarkRepository()

        const bookmark =
          createBookmark({
            id: FIRST_BOOKMARK_ID,
            bookId: FIRST_BOOK_ID,
            pageNumber: 3,
            pageOffsetRatio: 0.25,
          })

        await repository.save(
          bookmark,
        )

        const restoredBookmark =
          await repository.findById(
            FIRST_BOOKMARK_ID,
          )

        expect(
          restoredBookmark,
        ).toEqual(
          bookmark,
        )
      },
    )

    it(
      'retorna null ao buscar um favorito inexistente pelo identificador',
      async () => {
        const repository =
          new IndexedDbBookmarkRepository()

        const restoredBookmark =
          await repository.findById(
            FIRST_BOOKMARK_ID,
          )

        expect(
          restoredBookmark,
        ).toBeNull()
      },
    )

    it(
      'atualiza um favorito existente ao salvar o mesmo identificador',
      async () => {
        const repository =
          new IndexedDbBookmarkRepository()

        const originalBookmark =
          createBookmark({
            id: FIRST_BOOKMARK_ID,
            bookId: FIRST_BOOK_ID,
            pageNumber: 4,
            pageOffsetRatio: 0.2,
          })

        await repository.save(
          originalBookmark,
        )

        const updatedBookmark:
          Bookmark = {
            ...originalBookmark,
            pageNumber: 7,
            pageOffsetRatio: 0.6,
            createdAt: UPDATED_DATE,
          }

        await repository.save(
          updatedBookmark,
        )

        const restoredBookmark =
          await repository.findById(
            FIRST_BOOKMARK_ID,
          )

        expect(
          restoredBookmark,
        ).toEqual(
          updatedBookmark,
        )
      },
    )

    it(
      'lista somente os favoritos do livro solicitado',
      async () => {
        const repository =
          new IndexedDbBookmarkRepository()

        await repository.save(
          createBookmark({
            id: FIRST_BOOKMARK_ID,
            bookId: FIRST_BOOK_ID,
            pageNumber: 2,
            pageOffsetRatio: 0.1,
          }),
        )

        await repository.save(
          createBookmark({
            id: SECOND_BOOKMARK_ID,
            bookId: FIRST_BOOK_ID,
            pageNumber: 8,
            pageOffsetRatio: 0.5,
          }),
        )

        await repository.save(
          createBookmark({
            id: THIRD_BOOKMARK_ID,
            bookId: SECOND_BOOK_ID,
            pageNumber: 4,
            pageOffsetRatio: 0.3,
          }),
        )

        const bookmarks =
          await repository.findByBookId(
            FIRST_BOOK_ID,
          )

        expect(
          bookmarks
            .map(
              (bookmark) =>
                bookmark.id,
            )
            .sort(),
        ).toEqual(
          [
            FIRST_BOOKMARK_ID,
            SECOND_BOOKMARK_ID,
          ].sort(),
        )
      },
    )

    it(
      'recupera favorito pelo livro e pela página',
      async () => {
        const repository =
          new IndexedDbBookmarkRepository()

        const expectedBookmark =
          createBookmark({
            id: FIRST_BOOKMARK_ID,
            bookId: FIRST_BOOK_ID,
            pageNumber: 7,
            pageOffsetRatio: 0.45,
          })

        await repository.save(
          expectedBookmark,
        )

        await repository.save(
          createBookmark({
            id: SECOND_BOOKMARK_ID,
            bookId: FIRST_BOOK_ID,
            pageNumber: 9,
            pageOffsetRatio: 0.2,
          }),
        )

        await repository.save(
          createBookmark({
            id: THIRD_BOOKMARK_ID,
            bookId: SECOND_BOOK_ID,
            pageNumber: 7,
            pageOffsetRatio: 0.8,
          }),
        )

        const restoredBookmark =
          await repository
            .findByBookAndPage(
              FIRST_BOOK_ID,
              7,
            )

        expect(
          restoredBookmark,
        ).toEqual(
          expectedBookmark,
        )
      },
    )

    it(
      'retorna null quando não existe favorito para o livro e a página',
      async () => {
        const repository =
          new IndexedDbBookmarkRepository()

        await repository.save(
          createBookmark({
            id: FIRST_BOOKMARK_ID,
            bookId: FIRST_BOOK_ID,
            pageNumber: 5,
            pageOffsetRatio: 0.3,
          }),
        )

        const restoredBookmark =
          await repository
            .findByBookAndPage(
              FIRST_BOOK_ID,
              6,
            )

        expect(
          restoredBookmark,
        ).toBeNull()
      },
    )

    it(
      'exclui um favorito pelo identificador',
      async () => {
        const repository =
          new IndexedDbBookmarkRepository()

        const bookmark =
          createBookmark({
            id: FIRST_BOOKMARK_ID,
            bookId: FIRST_BOOK_ID,
            pageNumber: 3,
            pageOffsetRatio: 0.25,
          })

        await repository.save(
          bookmark,
        )

        await repository.deleteById(
          FIRST_BOOKMARK_ID,
        )

        const restoredBookmark =
          await repository.findById(
            FIRST_BOOKMARK_ID,
          )

        expect(
          restoredBookmark,
        ).toBeNull()
      },
    )

    it(
      'exclui todos os favoritos de um livro sem afetar outro livro',
      async () => {
        const repository =
          new IndexedDbBookmarkRepository()

        const firstDeletedBookmark =
          createBookmark({
            id: FIRST_BOOKMARK_ID,
            bookId: FIRST_BOOK_ID,
            pageNumber: 2,
            pageOffsetRatio: 0.1,
          })

        const secondDeletedBookmark =
          createBookmark({
            id: SECOND_BOOKMARK_ID,
            bookId: FIRST_BOOK_ID,
            pageNumber: 6,
            pageOffsetRatio: 0.4,
          })

        const preservedBookmark =
          createBookmark({
            id: THIRD_BOOKMARK_ID,
            bookId: SECOND_BOOK_ID,
            pageNumber: 4,
            pageOffsetRatio: 0.7,
          })

        await repository.save(
          firstDeletedBookmark,
        )

        await repository.save(
          secondDeletedBookmark,
        )

        await repository.save(
          preservedBookmark,
        )

        await repository.deleteByBookId(
          FIRST_BOOK_ID,
        )

        const deletedBookBookmarks =
          await repository.findByBookId(
            FIRST_BOOK_ID,
          )

        const preservedBookBookmarks =
          await repository.findByBookId(
            SECOND_BOOK_ID,
          )

        const firstDeletedById =
          await repository.findById(
            FIRST_BOOKMARK_ID,
          )

        const secondDeletedById =
          await repository.findById(
            SECOND_BOOKMARK_ID,
          )

        const preservedById =
          await repository.findById(
            THIRD_BOOKMARK_ID,
          )

        expect(
          deletedBookBookmarks,
        ).toEqual([])

        expect(
          firstDeletedById,
        ).toBeNull()

        expect(
          secondDeletedById,
        ).toBeNull()

        expect(
          preservedBookBookmarks,
        ).toEqual([
          preservedBookmark,
        ])

        expect(
          preservedById,
        ).toEqual(
          preservedBookmark,
        )
      },
    )
  },
)

import type {
  StateCreator,
} from 'zustand'
import {
  createStore,
} from 'zustand/vanilla'
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import type {
  LibraryBookItem,
} from '@/models/dtos/LibraryBookItem'
import type {
  Book,
} from '@/models/entities/Book'
import {
  AsyncStatus,
} from '@/models/enums/AsyncStatus'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  AppStore,
} from '@/stores/appStore.types'
import {
  createLibrarySlice,
} from '@/stores/slices/createLibrarySlice'

const controllerMocks = vi.hoisted(
  () => ({
    loadLibrary:
      vi.fn(),

    updateBookMetadata:
      vi.fn(),
  }),
)

vi.mock(
  '@/app/providers/applicationContainer',
  () => ({
    applicationContainer: {
      controllers: {
        loadLibrary: {
          execute:
            controllerMocks.loadLibrary,
        },

        updateBookMetadata: {
          execute:
            controllerMocks.updateBookMetadata,
        },
      },
    },
  }),
)

const BOOK_ID =
  'book-metadata-slice-test' as
    BookId

function createBook(
  title = 'Título original',
  author: string | null =
    'Autor original',
): Book {
  return {
    id: BOOK_ID,
    title,
    author,
    originalFileName:
      'livro.pdf',
    fileSizeBytes:
      1024,
    mimeType:
      'application/pdf',
    totalPages:
      20,
    pdfFingerprint:
      'fingerprint-slice-metadata',
    importedAt:
      '2026-09-17T12:00:00.000Z' as
        Book['importedAt'],
    updatedAt:
      '2026-09-17T12:00:00.000Z' as
        Book['updatedAt'],
    lastOpenedAt:
      null,
  }
}

function createItem(
  book: Book,
): LibraryBookItem {
  return {
    book,
    cover:
      null,
    readingProgress:
      null,
  }
}

function createStoreForTest() {
  return createStore<AppStore>()(
    createLibrarySlice as unknown as
      StateCreator<AppStore>,
  )
}

describe(
  'createLibrarySlice metadata',
  () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it(
      'atualiza metadados, estado local e recarrega a ordenação',
      async () => {
        const originalItem =
          createItem(
            createBook(),
          )

        const updatedBook =
          createBook(
            'Novo título',
            'Novo autor',
          )

        const updatedItem =
          createItem(
            updatedBook,
          )

        controllerMocks
          .updateBookMetadata
          .mockResolvedValue(
            updatedBook,
          )

        controllerMocks
          .loadLibrary
          .mockResolvedValue([
            updatedItem,
          ])

        const store =
          createStoreForTest()

        store.setState({
          libraryItems: [
            originalItem,
          ],
        })

        await store
          .getState()
          .updateBookMetadata(
            BOOK_ID,
            'Novo título',
            'Novo autor',
          )

        expect(
          controllerMocks
            .updateBookMetadata,
        ).toHaveBeenCalledWith({
          bookId:
            BOOK_ID,
          title:
            'Novo título',
          author:
            'Novo autor',
        })

        expect(
          controllerMocks
            .loadLibrary,
        ).toHaveBeenCalledTimes(1)

        expect(
          store.getState()
            .libraryItems,
        ).toEqual([
          updatedItem,
        ])

        expect(
          store.getState()
            .bookMetadataUpdateStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )
      },
    )

    it(
      'expõe erro e preserva a biblioteca quando a atualização falha',
      async () => {
        const originalItem =
          createItem(
            createBook(),
          )

        controllerMocks
          .updateBookMetadata
          .mockRejectedValue(
            new Error(
              'falha no update',
            ),
          )

        const store =
          createStoreForTest()

        store.setState({
          libraryItems: [
            originalItem,
          ],
        })

        await store
          .getState()
          .updateBookMetadata(
            BOOK_ID,
            'Novo título',
            null,
          )

        expect(
          store.getState()
            .libraryItems,
        ).toEqual([
          originalItem,
        ])

        expect(
          store.getState()
            .bookMetadataUpdateStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )

        expect(
          store.getState()
            .libraryErrorMessage,
        ).toBe(
          'falha no update',
        )

        expect(
          controllerMocks
            .loadLibrary,
        ).not.toHaveBeenCalled()
      },
    )
  },
)

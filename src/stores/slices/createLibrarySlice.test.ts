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
import { AsyncStatus } from '@/models/enums/AsyncStatus'
import {
  LibrarySortMode,
  type LibrarySortMode as LibrarySortModeValue,
} from '@/models/enums/LibrarySortMode'
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

    importPdf:
      vi.fn(),

    deleteBook:
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

        importPdf: {
          execute:
            controllerMocks.importPdf,
        },

        deleteBook: {
          execute:
            controllerMocks.deleteBook,
        },
      },
    },
  }),
)

const BOOK_ID =
  'book-library-slice-test' as BookId

const ALTERNATE_SORT_MODE =
  'alternate-sort-mode-test' as LibrarySortModeValue

const TEST_IMPORT_WARNING =
  'metadata-unavailable' as AppStore['lastImportWarnings'][number]

function createStoreForTest() {
  return createStore<AppStore>()(
    createLibrarySlice as unknown as StateCreator<AppStore>,
  )
}

function createLibraryItem(
  id: BookId = BOOK_ID,
): LibraryBookItem {
  return {
    book: {
      id,
    },
  } as unknown as LibraryBookItem
}

describe(
  'createLibrarySlice',
  () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it(
      'inicia com estado padrão da biblioteca',
      () => {
        const store =
          createStoreForTest()

        expect(
          store.getState(),
        ).toMatchObject({
          libraryItems: [],
          librarySortMode:
            LibrarySortMode.RECENTLY_OPENED,
          libraryLoadStatus:
            AsyncStatus.IDLE,
          pdfImportStatus:
            AsyncStatus.IDLE,
          bookDeleteStatus:
            AsyncStatus.IDLE,
          libraryErrorMessage:
            null,
          lastImportWarnings: [],
        })
      },
    )

    it(
      'carrega a biblioteca usando a ordenação atual por padrão',
      async () => {
        const items = [
          createLibraryItem(),
        ]

        controllerMocks.loadLibrary
          .mockResolvedValue(
            items,
          )

        const store =
          createStoreForTest()

        await store
          .getState()
          .loadLibrary()

        expect(
          controllerMocks.loadLibrary,
        ).toHaveBeenCalledWith({
          sortMode:
            LibrarySortMode.RECENTLY_OPENED,
        })

        expect(
          store.getState(),
        ).toMatchObject({
          libraryItems:
            items,
          librarySortMode:
            LibrarySortMode.RECENTLY_OPENED,
          libraryLoadStatus:
            AsyncStatus.SUCCESS,
          libraryErrorMessage:
            null,
        })
      },
    )

    it(
      'carrega e persiste uma ordenação informada explicitamente',
      async () => {
        controllerMocks.loadLibrary
          .mockResolvedValue(
            [],
          )

        const store =
          createStoreForTest()

        await store
          .getState()
          .loadLibrary(
            ALTERNATE_SORT_MODE,
          )

        expect(
          controllerMocks.loadLibrary,
        ).toHaveBeenCalledWith({
          sortMode:
            ALTERNATE_SORT_MODE,
        })

        expect(
          store.getState()
            .librarySortMode,
        ).toBe(
          ALTERNATE_SORT_MODE,
        )
      },
    )

    it(
      'setLibrarySortMode recarrega a biblioteca com a nova ordenação',
      async () => {
        controllerMocks.loadLibrary
          .mockResolvedValue(
            [],
          )

        const store =
          createStoreForTest()

        await store
          .getState()
          .setLibrarySortMode(
            ALTERNATE_SORT_MODE,
          )

        expect(
          controllerMocks.loadLibrary,
        ).toHaveBeenCalledWith({
          sortMode:
            ALTERNATE_SORT_MODE,
        })

        expect(
          store.getState()
            .librarySortMode,
        ).toBe(
          ALTERNATE_SORT_MODE,
        )
      },
    )

    it(
      'registra erro quando o carregamento da biblioteca falha',
      async () => {
        controllerMocks.loadLibrary
          .mockRejectedValue(
            new Error(
              'falha ao carregar',
            ),
          )

        const store =
          createStoreForTest()

        await store
          .getState()
          .loadLibrary()

        expect(
          store.getState(),
        ).toMatchObject({
          libraryLoadStatus:
            AsyncStatus.ERROR,
          libraryErrorMessage:
            'falha ao carregar',
        })
      },
    )

    it(
      'importa PDF sem incluir password quando ele não foi informado e recarrega a biblioteca',
      async () => {
        const file =
          new File(
            [
              new ArrayBuffer(
                1,
              ),
            ],
            'livro.pdf',
            {
              type:
                'application/pdf',
            },
          )

        const warnings = [
          TEST_IMPORT_WARNING,
        ]

        const items = [
          createLibraryItem(),
        ]

        controllerMocks.importPdf
          .mockResolvedValue({
            warnings,
          })

        controllerMocks.loadLibrary
          .mockResolvedValue(
            items,
          )

        const store =
          createStoreForTest()

        await store
          .getState()
          .importPdf(
            file,
          )

        expect(
          controllerMocks.importPdf,
        ).toHaveBeenCalledWith({
          file,
        })

        expect(
          controllerMocks.loadLibrary,
        ).toHaveBeenCalledWith({
          sortMode:
            LibrarySortMode.RECENTLY_OPENED,
        })

        expect(
          store.getState(),
        ).toMatchObject({
          libraryItems:
            items,
          pdfImportStatus:
            AsyncStatus.SUCCESS,
          lastImportWarnings:
            warnings,
          libraryErrorMessage:
            null,
        })
      },
    )

    it(
      'encaminha password quando informado na importação',
      async () => {
        const file =
          new File(
            [
              new ArrayBuffer(
                1,
              ),
            ],
            'protegido.pdf',
            {
              type:
                'application/pdf',
            },
          )

        controllerMocks.importPdf
          .mockResolvedValue({
            warnings: [],
          })

        controllerMocks.loadLibrary
          .mockResolvedValue(
            [],
          )

        const store =
          createStoreForTest()

        await store
          .getState()
          .importPdf(
            file,
            'segredo',
          )

        expect(
          controllerMocks.importPdf,
        ).toHaveBeenCalledWith({
          file,
          password:
            'segredo',
        })
      },
    )

    it(
      'registra erro de importação e não recarrega a biblioteca quando o controller falha',
      async () => {
        controllerMocks.importPdf
          .mockRejectedValue(
            new Error(
              'PDF inválido',
            ),
          )

        const store =
          createStoreForTest()

        await store
          .getState()
          .importPdf(
            new File(
              [
                new ArrayBuffer(
                  1,
                ),
              ],
              'invalido.pdf',
            ),
          )

        expect(
          controllerMocks.loadLibrary,
        ).not.toHaveBeenCalled()

        expect(
          store.getState(),
        ).toMatchObject({
          pdfImportStatus:
            AsyncStatus.ERROR,
          libraryErrorMessage:
            'PDF inválido',
        })
      },
    )

    it(
      'fecha o livro aberto antes de excluir o mesmo livro e recarrega a biblioteca',
      async () => {
        const closeBook =
          vi.fn().mockResolvedValue(
            undefined,
          )

        const items = [
          createLibraryItem(
            'outro-livro' as BookId,
          ),
        ]

        controllerMocks.deleteBook
          .mockResolvedValue(
            undefined,
          )

        controllerMocks.loadLibrary
          .mockResolvedValue(
            items,
          )

        const store =
          createStoreForTest()

        store.setState({
          openedBook: {
            book: {
              id:
                BOOK_ID,
            },
          } as AppStore['openedBook'],

          closeBook,
        } as Partial<AppStore>)

        await store
          .getState()
          .deleteBook(
            BOOK_ID,
          )

        expect(
          closeBook,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          controllerMocks.deleteBook,
        ).toHaveBeenCalledWith({
          bookId:
            BOOK_ID,
        })

        expect(
          closeBook.mock.invocationCallOrder[0],
        ).toBeLessThan(
          controllerMocks.deleteBook
            .mock.invocationCallOrder[0] ?? 0,
        )

        expect(
          store.getState(),
        ).toMatchObject({
          libraryItems:
            items,
          bookDeleteStatus:
            AsyncStatus.SUCCESS,
          libraryErrorMessage:
            null,
        })
      },
    )

    it(
      'não fecha outro livro aberto ao excluir um livro diferente',
      async () => {
        const closeBook =
          vi.fn().mockResolvedValue(
            undefined,
          )

        controllerMocks.deleteBook
          .mockResolvedValue(
            undefined,
          )

        controllerMocks.loadLibrary
          .mockResolvedValue(
            [],
          )

        const store =
          createStoreForTest()

        store.setState({
          openedBook: {
            book: {
              id:
                'outro-livro' as BookId,
            },
          } as AppStore['openedBook'],

          closeBook,
        } as Partial<AppStore>)

        await store
          .getState()
          .deleteBook(
            BOOK_ID,
          )

        expect(
          closeBook,
        ).not.toHaveBeenCalled()

        expect(
          controllerMocks.deleteBook,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      'registra erro e não exclui quando fechar o livro atual falha',
      async () => {
        const closeBook =
          vi.fn().mockRejectedValue(
            new Error(
              'falha ao fechar',
            ),
          )

        const store =
          createStoreForTest()

        store.setState({
          openedBook: {
            book: {
              id:
                BOOK_ID,
            },
          } as AppStore['openedBook'],

          closeBook,
        } as Partial<AppStore>)

        await store
          .getState()
          .deleteBook(
            BOOK_ID,
          )

        expect(
          controllerMocks.deleteBook,
        ).not.toHaveBeenCalled()

        expect(
          store.getState(),
        ).toMatchObject({
          bookDeleteStatus:
            AsyncStatus.ERROR,
          libraryErrorMessage:
            'falha ao fechar',
        })
      },
    )

    it(
      'limpa erro e avisos de importação',
      () => {
        const store =
          createStoreForTest()

        store.setState({
          libraryErrorMessage:
            'erro anterior',

          lastImportWarnings: [
            TEST_IMPORT_WARNING,
          ],
        } as Partial<AppStore>)

        store
          .getState()
          .clearLibraryError()

        store
          .getState()
          .clearImportWarnings()

        expect(
          store.getState()
            .libraryErrorMessage,
        ).toBeNull()

        expect(
          store.getState()
            .lastImportWarnings,
        ).toEqual(
          [],
        )
      },
    )
  },
)
import type { StateCreator } from 'zustand'

import { applicationContainer } from '@/app/providers/applicationContainer'
import { AsyncStatus } from '@/models/enums/AsyncStatus'
import {
  LibrarySortMode,
  type LibrarySortMode as LibrarySortModeValue,
} from '@/models/enums/LibrarySortMode'
import type {
  AppStore,
  LibrarySlice,
} from '@/stores/appStore.types'
import { getErrorMessage } from '@/utils/errors/getErrorMessage'

type LibrarySliceCreator = StateCreator<
  AppStore,
  [],
  [],
  LibrarySlice
>

async function loadSortedLibraryItems(
  sortMode: LibrarySortModeValue,
) {
  return applicationContainer.controllers.loadLibrary.execute({
    sortMode,
  })
}

export const createLibrarySlice: LibrarySliceCreator = (
  set,
  get,
) => ({
  libraryItems: [],
  librarySortMode: LibrarySortMode.RECENTLY_OPENED,

  libraryLoadStatus: AsyncStatus.IDLE,
  pdfImportStatus: AsyncStatus.IDLE,
  bookDeleteStatus: AsyncStatus.IDLE,
  bookMetadataUpdateStatus:
    AsyncStatus.IDLE,

  libraryErrorMessage: null,
  lastImportWarnings: [],

  loadLibrary: async (sortMode) => {
    const selectedSortMode =
      sortMode ?? get().librarySortMode

    set({
      libraryLoadStatus: AsyncStatus.LOADING,
      libraryErrorMessage: null,
    })

    try {
      const libraryItems =
        await loadSortedLibraryItems(
          selectedSortMode,
        )

      set({
        libraryItems,
        librarySortMode:
          selectedSortMode,
        libraryLoadStatus:
          AsyncStatus.SUCCESS,
      })
    } catch (error) {
      set({
        libraryLoadStatus:
          AsyncStatus.ERROR,
        libraryErrorMessage:
          getErrorMessage(
            error,
            'Não foi possível carregar a biblioteca.',
          ),
      })
    }
  },

  setLibrarySortMode: async (
    sortMode,
  ) => {
    await get().loadLibrary(
      sortMode,
    )
  },

  importPdf: async (
    file,
    password,
  ) => {
    set({
      pdfImportStatus:
        AsyncStatus.LOADING,
      libraryErrorMessage: null,
      lastImportWarnings: [],
    })

    try {
      const command =
        password === undefined
          ? {
              file,
            }
          : {
              file,
              password,
            }

      const result =
        await applicationContainer.controllers.importPdf.execute(
          command,
        )

      const selectedSortMode =
        get().librarySortMode

      const libraryItems =
        await loadSortedLibraryItems(
          selectedSortMode,
        )

      set({
        libraryItems,
        pdfImportStatus:
          AsyncStatus.SUCCESS,
        lastImportWarnings:
          result.warnings,
      })
    } catch (error) {
      set({
        pdfImportStatus:
          AsyncStatus.ERROR,
        libraryErrorMessage:
          getErrorMessage(
            error,
            'Não foi possível importar o documento PDF.',
          ),
      })
    }
  },

  importPdfs: async (files) => {
    if (files.length === 0) {
      return
    }

    set({
      pdfImportStatus:
        AsyncStatus.LOADING,
      libraryErrorMessage: null,
      lastImportWarnings: [],
    })

    const importWarnings = [
      ...get().lastImportWarnings,
    ]

    let firstImportError:
      unknown | null = null

    for (const file of files) {
      try {
        const result =
          await applicationContainer.controllers.importPdf.execute(
            {
              file,
            },
          )

        importWarnings.push(
          ...result.warnings,
        )
      } catch (error) {
        firstImportError ??=
          error
      }
    }

    try {
      const selectedSortMode =
        get().librarySortMode

      const libraryItems =
        await loadSortedLibraryItems(
          selectedSortMode,
        )

      if (
        firstImportError !== null
      ) {
        set({
          libraryItems,
          pdfImportStatus:
            AsyncStatus.ERROR,
          lastImportWarnings:
            importWarnings,
          libraryErrorMessage:
            getErrorMessage(
              firstImportError,
              'Não foi possível importar um ou mais documentos PDF.',
            ),
        })

        return
      }

      set({
        libraryItems,
        pdfImportStatus:
          AsyncStatus.SUCCESS,
        lastImportWarnings:
          importWarnings,
      })
    } catch (error) {
      set({
        pdfImportStatus:
          AsyncStatus.ERROR,
        lastImportWarnings:
          importWarnings,
        libraryErrorMessage:
          getErrorMessage(
            error,
            'Os PDFs foram processados, mas não foi possível atualizar a biblioteca.',
          ),
      })
    }
  },

  deleteBook: async (bookId) => {
    set({
      bookDeleteStatus:
        AsyncStatus.LOADING,
      libraryErrorMessage: null,
    })

    try {
      const openedBook =
        get().openedBook

      if (
        openedBook?.book.id ===
        bookId
      ) {
        await get().closeBook()
      }

      await applicationContainer.controllers.deleteBook.execute(
        {
          bookId,
        },
      )

      const selectedSortMode =
        get().librarySortMode

      const libraryItems =
        await loadSortedLibraryItems(
          selectedSortMode,
        )

      set({
        libraryItems,
        bookDeleteStatus:
          AsyncStatus.SUCCESS,
      })
    } catch (error) {
      set({
        bookDeleteStatus:
          AsyncStatus.ERROR,
        libraryErrorMessage:
          getErrorMessage(
            error,
            'Não foi possível excluir o livro.',
          ),
      })
    }
  },

  updateBookMetadata: async (
    bookId,
    title,
    author,
  ) => {
    set({
      bookMetadataUpdateStatus:
        AsyncStatus.LOADING,
      libraryErrorMessage: null,
    })

    let updatedBook

    try {
      updatedBook =
        await applicationContainer
          .controllers
          .updateBookMetadata
          .execute({
            bookId,
            title,
            author,
          })
    } catch (error) {
      set({
        bookMetadataUpdateStatus:
          AsyncStatus.ERROR,
        libraryErrorMessage:
          getErrorMessage(
            error,
            'Não foi possível atualizar as informações do livro.',
          ),
      })

      return
    }

    const currentState = get()

    const locallyUpdatedItems =
      currentState.libraryItems.map(
        (item) =>
          item.book.id === bookId
            ? {
                ...item,
                book: updatedBook,
              }
            : item,
      )

    const openedBook =
      currentState.openedBook

    set({
      libraryItems:
        locallyUpdatedItems,

      ...(openedBook?.book.id ===
      bookId
        ? {
            openedBook: {
              ...openedBook,
              book: updatedBook,
            },
          }
        : {}),

      bookMetadataUpdateStatus:
        AsyncStatus.SUCCESS,
    })

    try {
      const sortedLibraryItems =
        await loadSortedLibraryItems(
          get().librarySortMode,
        )

      set({
        libraryItems:
          sortedLibraryItems,
      })
    } catch {
      set({
        libraryErrorMessage:
          'As informações foram salvas, mas não foi possível atualizar a ordenação da biblioteca agora.',
      })
    }
  },

  clearLibraryError: () => {
    set({
      libraryErrorMessage: null,
    })
  },

  clearImportWarnings: () => {
    set({
      lastImportWarnings: [],
    })
  },
})
import type {
  PDFPageProxy,
} from 'pdfjs-dist'
import type { StateCreator } from 'zustand'

import { applicationContainer } from '@/app/providers/applicationContainer'
import type { OpenBookResult } from '@/models/dtos/OpenBookResult'
import type { Bookmark } from '@/models/entities/Bookmark'
import {
  AsyncStatus,
  type AsyncStatus as AsyncStatusValue,
} from '@/models/enums/AsyncStatus'
import type { LoadedPdfDocument } from '@/services/pdf/PdfDocumentService'
import type {
  AppStore,
  ReaderSlice,
} from '@/stores/appStore.types'
import { getErrorMessage } from '@/utils/errors/getErrorMessage'

type ReaderSliceCreator = StateCreator<
  AppStore,
  [],
  [],
  ReaderSlice
>

const CONTINUOUS_PAGE_BATCH_SIZE = 4
const THUMBNAIL_PAGE_BATCH_SIZE = 8

interface ReadingPosition {
  readonly currentPage: number
  readonly pageOffsetRatio: number
}

function normalizeCurrentPage(
  currentPage: number,
  totalPages: number,
): number {
  if (
    !Number.isFinite(currentPage) ||
    totalPages <= 0
  ) {
    return 1
  }

  return Math.min(
    Math.max(
      Math.trunc(currentPage),
      1,
    ),
    totalPages,
  )
}

function normalizePageOffsetRatio(
  pageOffsetRatio: number,
): number {
  if (!Number.isFinite(pageOffsetRatio)) {
    return 0
  }

  return Math.min(
    Math.max(pageOffsetRatio, 0),
    1,
  )
}

function resolveInitialReadingPosition(
  openedBook: OpenBookResult,
): ReadingPosition {
  const readingProgress =
    openedBook.readingProgress

  if (readingProgress === null) {
    return {
      currentPage: 1,
      pageOffsetRatio: 0,
    }
  }

  return {
    currentPage: normalizeCurrentPage(
      readingProgress.currentPage,
      openedBook.book.totalPages,
    ),

    pageOffsetRatio:
      normalizePageOffsetRatio(
        readingProgress.pageOffsetRatio,
      ),
  }
}

function sortBookmarksByPosition(
  bookmarks: readonly Bookmark[],
): readonly Bookmark[] {
  return [...bookmarks].sort(
    (
      firstBookmark,
      secondBookmark,
    ) => {
      const pageDifference =
        firstBookmark.pageNumber -
        secondBookmark.pageNumber

      if (pageDifference !== 0) {
        return pageDifference
      }

      const offsetDifference =
        firstBookmark.pageOffsetRatio -
        secondBookmark.pageOffsetRatio

      if (offsetDifference !== 0) {
        return offsetDifference
      }

      return firstBookmark.createdAt.localeCompare(
        secondBookmark.createdAt,
      )
    },
  )
}

function mergeBookmark(
  bookmarks: readonly Bookmark[],
  bookmark: Bookmark,
): readonly Bookmark[] {
  const bookmarksWithoutDuplicate =
    bookmarks.filter(
      (currentBookmark) =>
        currentBookmark.id !== bookmark.id,
    )

  return sortBookmarksByPosition([
    ...bookmarksWithoutDuplicate,
    bookmark,
  ])
}

function mergePdfPages(
  currentPages: readonly PDFPageProxy[],
  incomingPages: readonly PDFPageProxy[],
): readonly PDFPageProxy[] {
  const pagesByNumber =
    new Map<number, PDFPageProxy>()

  for (const page of currentPages) {
    pagesByNumber.set(
      page.pageNumber,
      page,
    )
  }

  for (const page of incomingPages) {
    pagesByNumber.set(
      page.pageNumber,
      page,
    )
  }

  return [
    ...pagesByNumber.values(),
  ].sort(
    (
      firstPage,
      secondPage,
    ) =>
      firstPage.pageNumber -
      secondPage.pageNumber,
  )
}

interface ContinuousPdfPagesState {
  readonly loadedContinuousPdfPages:
    readonly PDFPageProxy[]

  readonly continuousPagesStartPage:
    number | null

  readonly continuousPagesEndPage:
    number | null

  readonly continuousHasPreviousPages:
    boolean

  readonly continuousHasNextPages:
    boolean
}

function createContinuousPdfPagesState(
  pages: readonly PDFPageProxy[],
  totalPages: number,
): ContinuousPdfPagesState {
  const sortedPages =
    mergePdfPages(
      [],
      pages,
    )

  const firstPage =
    sortedPages[0] ?? null

  const lastPage =
    sortedPages[
      sortedPages.length - 1
    ] ?? null

  if (
    firstPage === null ||
    lastPage === null
  ) {
    return {
      loadedContinuousPdfPages: [],
      continuousPagesStartPage: null,
      continuousPagesEndPage: null,
      continuousHasPreviousPages: false,
      continuousHasNextPages: false,
    }
  }

  return {
    loadedContinuousPdfPages:
      sortedPages,

    continuousPagesStartPage:
      firstPage.pageNumber,

    continuousPagesEndPage:
      lastPage.pageNumber,

    continuousHasPreviousPages:
      firstPage.pageNumber > 1,

    continuousHasNextPages:
      lastPage.pageNumber <
      totalPages,
  }
}

interface ThumbnailPdfPagesState {
  readonly loadedThumbnailPdfPages:
    readonly PDFPageProxy[]

  readonly thumbnailPagesStartPage:
    number | null

  readonly thumbnailPagesEndPage:
    number | null

  readonly thumbnailHasPreviousPages:
    boolean

  readonly thumbnailHasNextPages:
    boolean
}

function createThumbnailPdfPagesState(
  pages: readonly PDFPageProxy[],
  totalPages: number,
): ThumbnailPdfPagesState {
  const sortedPages =
    mergePdfPages(
      [],
      pages,
    )

  const firstPage =
    sortedPages[0] ?? null

  const lastPage =
    sortedPages[
      sortedPages.length - 1
    ] ?? null

  return {
    loadedThumbnailPdfPages:
      sortedPages,

    thumbnailPagesStartPage:
      firstPage?.pageNumber ?? null,

    thumbnailPagesEndPage:
      lastPage?.pageNumber ?? null,

    thumbnailHasPreviousPages:
      firstPage !== null &&
      firstPage.pageNumber > 1,

    thumbnailHasNextPages:
      lastPage !== null &&
      lastPage.pageNumber <
        totalPages,
  }
}

async function closeDocumentSilently(
  loadedPdfDocument:
    LoadedPdfDocument | null,
): Promise<void> {
  if (
    loadedPdfDocument === null ||
    loadedPdfDocument.isClosed
  ) {
    return
  }

  try {
    await loadedPdfDocument.close()
  } catch {
    return
  }
}

export const createReaderSlice:
  ReaderSliceCreator = (
    set,
    get,
  ) => {
    let openOperationSequence = 0
    let pageLoadOperationSequence = 0
    let secondaryPageLoadOperationSequence = 0
    let continuousPagesLoadOperationSequence = 0
    let thumbnailPagesLoadOperationSequence = 0
    let bookmarkLoadOperationSequence = 0
    let bookmarkMutationOperationSequence = 0

    return {
      openedBook: null,
      loadedPdfDocument: null,

      loadedPdfPage: null,
      loadedSecondaryPdfPage: null,

      loadedContinuousPdfPages: [],
      continuousPagesStartPage: null,
      continuousPagesEndPage: null,
      continuousHasPreviousPages: false,
      continuousHasNextPages: false,

      loadedThumbnailPdfPages: [],
      thumbnailPagesStartPage: null,
      thumbnailPagesEndPage: null,
      thumbnailHasPreviousPages: false,
      thumbnailHasNextPages: false,

      bookmarks: [],

      currentPage: 1,
      pageOffsetRatio: 0,

      readerOpenStatus:
        AsyncStatus.IDLE,

      pageLoadStatus:
        AsyncStatus.IDLE,

      secondaryPageLoadStatus:
        AsyncStatus.IDLE,

      continuousPagesLoadStatus:
        AsyncStatus.IDLE,

      thumbnailPagesLoadStatus:
        AsyncStatus.IDLE,

      progressSaveStatus:
        AsyncStatus.IDLE,

      bookmarksLoadStatus:
        AsyncStatus.IDLE,

      bookmarkMutationStatus:
        AsyncStatus.IDLE,

      readerErrorMessage: null,
      pageLoadErrorMessage: null,
      secondaryPageLoadErrorMessage: null,
      continuousPagesLoadErrorMessage: null,
      thumbnailPagesLoadErrorMessage: null,
      bookmarkErrorMessage: null,

      openBook: async (
        bookId,
        password,
      ) => {
        const operationId =
          ++openOperationSequence

        ++pageLoadOperationSequence
        ++secondaryPageLoadOperationSequence
        ++continuousPagesLoadOperationSequence
        ++thumbnailPagesLoadOperationSequence
        ++bookmarkLoadOperationSequence
        ++bookmarkMutationOperationSequence

        set({
          loadedPdfPage: null,
          loadedSecondaryPdfPage: null,

          loadedContinuousPdfPages: [],
          continuousPagesStartPage: null,
          continuousPagesEndPage: null,
          continuousHasPreviousPages: false,
          continuousHasNextPages: false,

          loadedThumbnailPdfPages: [],
          thumbnailPagesStartPage: null,
          thumbnailPagesEndPage: null,
          thumbnailHasPreviousPages: false,
          thumbnailHasNextPages: false,

          bookmarks: [],

          readerOpenStatus:
            AsyncStatus.LOADING,

          pageLoadStatus:
            AsyncStatus.IDLE,

          secondaryPageLoadStatus:
            AsyncStatus.IDLE,

          continuousPagesLoadStatus:
            AsyncStatus.IDLE,

          thumbnailPagesLoadStatus:
            AsyncStatus.IDLE,

          bookmarksLoadStatus:
            AsyncStatus.IDLE,

          bookmarkMutationStatus:
            AsyncStatus.IDLE,

          readerErrorMessage: null,
          pageLoadErrorMessage: null,
          secondaryPageLoadErrorMessage: null,
          continuousPagesLoadErrorMessage: null,
          thumbnailPagesLoadErrorMessage: null,
          bookmarkErrorMessage: null,
        })

        let newLoadedPdfDocument:
          LoadedPdfDocument | null = null

        try {
          const openedBook =
            await applicationContainer
              .controllers
              .openBook
              .execute({
                bookId,
              })

          const openOptions =
            password === undefined
              ? {}
              : {
                  password,
                }

          newLoadedPdfDocument =
            await applicationContainer
              .services
              .pdfDocument
              .open(
                openedBook.bookFile.file,
                openOptions,
              )

          if (
            operationId !==
            openOperationSequence
          ) {
            await closeDocumentSilently(
              newLoadedPdfDocument,
            )

            return
          }

          const previousState = get()

          let transitionWarning:
            string | null = null

          if (
            previousState.openedBook !==
            null
          ) {
            try {
              await applicationContainer
                .controllers
                .saveReadingProgress
                .execute({
                  bookId:
                    previousState
                      .openedBook
                      .book
                      .id,

                  currentPage:
                    previousState
                      .currentPage,

                  pageOffsetRatio:
                    previousState
                      .pageOffsetRatio,
                })
            } catch (error) {
              transitionWarning =
                getErrorMessage(
                  error,
                  'O novo livro foi aberto, mas não foi possível salvar o progresso anterior.',
                )
            }
          }

          if (
            previousState
              .loadedPdfDocument !==
              null &&
            !previousState
              .loadedPdfDocument
              .isClosed
          ) {
            try {
              await previousState
                .loadedPdfDocument
                .close()
            } catch (error) {
              transitionWarning ??=
                getErrorMessage(
                  error,
                  'O novo livro foi aberto, mas o documento anterior não foi encerrado corretamente.',
                )
            }
          }

          if (
            operationId !==
            openOperationSequence
          ) {
            await closeDocumentSilently(
              newLoadedPdfDocument,
            )

            return
          }

          const initialPosition =
            resolveInitialReadingPosition(
              openedBook,
            )

          set({
            openedBook,

            loadedPdfDocument:
              newLoadedPdfDocument,

            loadedPdfPage: null,
            loadedSecondaryPdfPage: null,

            loadedContinuousPdfPages: [],
            continuousPagesStartPage: null,
            continuousPagesEndPage: null,
            continuousHasPreviousPages: false,
            continuousHasNextPages: false,

            bookmarks: [],

            currentPage:
              initialPosition.currentPage,

            pageOffsetRatio:
              initialPosition
                .pageOffsetRatio,

            readerOpenStatus:
              AsyncStatus.SUCCESS,

            pageLoadStatus:
              AsyncStatus.IDLE,

            secondaryPageLoadStatus:
              AsyncStatus.IDLE,

            continuousPagesLoadStatus:
              AsyncStatus.IDLE,

            progressSaveStatus:
              AsyncStatus.IDLE,

            bookmarksLoadStatus:
              AsyncStatus.IDLE,

            bookmarkMutationStatus:
              AsyncStatus.IDLE,

            readerErrorMessage:
              transitionWarning,

            pageLoadErrorMessage: null,
            secondaryPageLoadErrorMessage: null,
            continuousPagesLoadErrorMessage: null,
            bookmarkErrorMessage: null,
          })
        } catch (error) {
          await closeDocumentSilently(
            newLoadedPdfDocument,
          )

          if (
            operationId !==
            openOperationSequence
          ) {
            return
          }

          set({
            loadedPdfPage: null,
            loadedSecondaryPdfPage: null,

            loadedContinuousPdfPages: [],
            continuousPagesStartPage: null,
            continuousPagesEndPage: null,
            continuousHasPreviousPages: false,
            continuousHasNextPages: false,

            bookmarks: [],

            readerOpenStatus:
              AsyncStatus.ERROR,

            pageLoadStatus:
              AsyncStatus.IDLE,

            secondaryPageLoadStatus:
              AsyncStatus.IDLE,

            continuousPagesLoadStatus:
              AsyncStatus.IDLE,

            bookmarksLoadStatus:
              AsyncStatus.IDLE,

            bookmarkMutationStatus:
              AsyncStatus.IDLE,

            readerErrorMessage:
              getErrorMessage(
                error,
                'Não foi possível abrir o livro selecionado.',
              ),

            pageLoadErrorMessage: null,
            secondaryPageLoadErrorMessage: null,
            continuousPagesLoadErrorMessage: null,
            bookmarkErrorMessage: null,
          })
        }
      },

      closeBook: async () => {
        ++openOperationSequence
        ++pageLoadOperationSequence
        ++secondaryPageLoadOperationSequence
        ++continuousPagesLoadOperationSequence
        ++bookmarkLoadOperationSequence
        ++bookmarkMutationOperationSequence

        const {
          openedBook,
          loadedPdfDocument,
          currentPage,
          pageOffsetRatio,
        } = get()

        let closeErrorMessage:
          string | null = null

        let progressSaveStatus:
          AsyncStatusValue =
            AsyncStatus.IDLE

        set({
          loadedPdfPage: null,
          loadedSecondaryPdfPage: null,

          loadedContinuousPdfPages: [],
          continuousPagesStartPage: null,
          continuousPagesEndPage: null,
          continuousHasPreviousPages: false,
          continuousHasNextPages: false,

          loadedThumbnailPdfPages: [],
          thumbnailPagesStartPage: null,
          thumbnailPagesEndPage: null,
          thumbnailHasPreviousPages: false,
          thumbnailHasNextPages: false,

          bookmarks: [],

          readerOpenStatus:
            AsyncStatus.LOADING,

          pageLoadStatus:
            AsyncStatus.IDLE,

          secondaryPageLoadStatus:
            AsyncStatus.IDLE,

          continuousPagesLoadStatus:
            AsyncStatus.IDLE,

          thumbnailPagesLoadStatus:
            AsyncStatus.IDLE,

          bookmarksLoadStatus:
            AsyncStatus.IDLE,

          bookmarkMutationStatus:
            AsyncStatus.IDLE,

          readerErrorMessage: null,
          pageLoadErrorMessage: null,
          secondaryPageLoadErrorMessage: null,
          continuousPagesLoadErrorMessage: null,
          thumbnailPagesLoadErrorMessage: null,
          bookmarkErrorMessage: null,

          progressSaveStatus:
            openedBook === null
              ? AsyncStatus.IDLE
              : AsyncStatus.LOADING,
        })

        if (openedBook !== null) {
          try {
            await applicationContainer
              .controllers
              .saveReadingProgress
              .execute({
                bookId:
                  openedBook.book.id,

                currentPage,
                pageOffsetRatio,
              })

            progressSaveStatus =
              AsyncStatus.SUCCESS
          } catch (error) {
            progressSaveStatus =
              AsyncStatus.ERROR

            closeErrorMessage =
              getErrorMessage(
                error,
                'Não foi possível salvar o progresso antes de fechar o livro.',
              )
          }
        }

        if (
          loadedPdfDocument !== null &&
          !loadedPdfDocument.isClosed
        ) {
          try {
            await loadedPdfDocument.close()
          } catch (error) {
            closeErrorMessage ??=
              getErrorMessage(
                error,
                'Não foi possível encerrar corretamente o documento PDF.',
              )
          }
        }

        set({
          openedBook: null,
          loadedPdfDocument: null,

          loadedPdfPage: null,
          loadedSecondaryPdfPage: null,

          loadedContinuousPdfPages: [],
          continuousPagesStartPage: null,
          continuousPagesEndPage: null,
          continuousHasPreviousPages: false,
          continuousHasNextPages: false,

          loadedThumbnailPdfPages: [],
          thumbnailPagesStartPage: null,
          thumbnailPagesEndPage: null,
          thumbnailHasPreviousPages: false,
          thumbnailHasNextPages: false,

          bookmarks: [],

          currentPage: 1,
          pageOffsetRatio: 0,

          readerOpenStatus:
            AsyncStatus.IDLE,

          pageLoadStatus:
            AsyncStatus.IDLE,

          secondaryPageLoadStatus:
            AsyncStatus.IDLE,

          continuousPagesLoadStatus:
            AsyncStatus.IDLE,

          thumbnailPagesLoadStatus:
            AsyncStatus.IDLE,

          progressSaveStatus,

          bookmarksLoadStatus:
            AsyncStatus.IDLE,

          bookmarkMutationStatus:
            AsyncStatus.IDLE,

          readerErrorMessage:
            closeErrorMessage,

          pageLoadErrorMessage: null,
          secondaryPageLoadErrorMessage: null,
          continuousPagesLoadErrorMessage: null,
          thumbnailPagesLoadErrorMessage: null,
          bookmarkErrorMessage: null,
        })
      },

      loadPdfPage: async (
        pageNumber,
        prefetchPageNumber,
      ) => {
        const operationId =
          ++pageLoadOperationSequence

        ++secondaryPageLoadOperationSequence

        const loadedPdfDocument =
          get().loadedPdfDocument

        if (
          loadedPdfDocument === null ||
          loadedPdfDocument.isClosed
        ) {
          set({
            loadedPdfPage: null,
            loadedSecondaryPdfPage: null,

            pageLoadStatus:
              AsyncStatus.ERROR,

            secondaryPageLoadStatus:
              AsyncStatus.IDLE,

            pageLoadErrorMessage:
              'Nenhum documento PDF está aberto para carregar a página.',

            secondaryPageLoadErrorMessage: null,
          })

          return
        }

        set({
          loadedSecondaryPdfPage: null,

          pageLoadStatus:
            AsyncStatus.LOADING,

          secondaryPageLoadStatus:
            AsyncStatus.IDLE,

          pageLoadErrorMessage: null,
          secondaryPageLoadErrorMessage: null,
        })

        try {
          const loadPdfPageController =
            applicationContainer
              .controllers
              .loadPdfPage

          const loadedPdfPage =
            prefetchPageNumber === undefined
              ? await loadPdfPageController
                  .execute(
                    loadedPdfDocument.document,
                    pageNumber,
                  )
              : await loadPdfPageController
                  .execute(
                    loadedPdfDocument.document,
                    pageNumber,
                    prefetchPageNumber,
                  )

          if (
            operationId !==
            pageLoadOperationSequence
          ) {
            return
          }

          const currentState = get()

          if (
            currentState
              .loadedPdfDocument !==
              loadedPdfDocument ||
            loadedPdfDocument.isClosed
          ) {
            return
          }

          const pageChanged =
            currentState.currentPage !==
            loadedPdfPage.pageNumber

          set({
            loadedPdfPage,
            loadedSecondaryPdfPage: null,

            currentPage:
              loadedPdfPage.pageNumber,

            pageOffsetRatio:
              pageChanged
                ? 0
                : currentState
                    .pageOffsetRatio,

            pageLoadStatus:
              AsyncStatus.SUCCESS,

            secondaryPageLoadStatus:
              AsyncStatus.IDLE,

            pageLoadErrorMessage: null,
            secondaryPageLoadErrorMessage: null,
          })
        } catch (error) {
          if (
            operationId !==
            pageLoadOperationSequence
          ) {
            return
          }

          if (
            get().loadedPdfDocument !==
              loadedPdfDocument ||
            loadedPdfDocument.isClosed
          ) {
            return
          }

          set({
            loadedPdfPage: null,
            loadedSecondaryPdfPage: null,

            pageLoadStatus:
              AsyncStatus.ERROR,

            secondaryPageLoadStatus:
              AsyncStatus.IDLE,

            pageLoadErrorMessage:
              getErrorMessage(
                error,
                'Não foi possível carregar a página solicitada.',
              ),

            secondaryPageLoadErrorMessage: null,
          })
        }
      },

      loadSecondaryPdfPage:
        async () => {
          const currentState = get()

          const {
            openedBook,
            loadedPdfDocument,
            loadedPdfPage,
            loadedSecondaryPdfPage,
            secondaryPageLoadStatus,
          } = currentState

          if (
            openedBook === null ||
            loadedPdfDocument === null ||
            loadedPdfDocument.isClosed ||
            loadedPdfPage === null
          ) {
            ++secondaryPageLoadOperationSequence

            set({
              loadedSecondaryPdfPage: null,

              secondaryPageLoadStatus:
                AsyncStatus.ERROR,

              secondaryPageLoadErrorMessage:
                'A página principal precisa estar carregada antes da próxima página.',
            })

            return
          }

          const expectedSecondaryPageNumber =
            loadedPdfPage.pageNumber + 1

          if (
            expectedSecondaryPageNumber >
            openedBook.book.totalPages
          ) {
            ++secondaryPageLoadOperationSequence

            set({
              loadedSecondaryPdfPage: null,

              secondaryPageLoadStatus:
                AsyncStatus.SUCCESS,

              secondaryPageLoadErrorMessage: null,
            })

            return
          }

          if (
            loadedSecondaryPdfPage
              ?.pageNumber ===
              expectedSecondaryPageNumber &&
            secondaryPageLoadStatus ===
              AsyncStatus.SUCCESS
          ) {
            return
          }

          const operationId =
            ++secondaryPageLoadOperationSequence

          const primaryPageNumber =
            loadedPdfPage.pageNumber

          set({
            loadedSecondaryPdfPage: null,

            secondaryPageLoadStatus:
              AsyncStatus.LOADING,

            secondaryPageLoadErrorMessage: null,
          })

          try {
            const secondaryPage =
              await applicationContainer
                .controllers
                .loadSecondaryPdfPage
                .execute({
                  document:
                    loadedPdfDocument.document,

                  primaryPageNumber,

                  totalPages:
                    openedBook.book.totalPages,
                })

            if (
              operationId !==
              secondaryPageLoadOperationSequence
            ) {
              return
            }

            const latestState = get()

            if (
              latestState
                .loadedPdfDocument !==
                loadedPdfDocument ||
              loadedPdfDocument.isClosed ||
              latestState
                .loadedPdfPage
                ?.pageNumber !==
                primaryPageNumber
            ) {
              return
            }

            set({
              loadedSecondaryPdfPage:
                secondaryPage,

              secondaryPageLoadStatus:
                AsyncStatus.SUCCESS,

              secondaryPageLoadErrorMessage: null,
            })
          } catch (error) {
            if (
              operationId !==
              secondaryPageLoadOperationSequence
            ) {
              return
            }

            const latestState = get()

            if (
              latestState
                .loadedPdfDocument !==
                loadedPdfDocument ||
              loadedPdfDocument.isClosed ||
              latestState
                .loadedPdfPage
                ?.pageNumber !==
                primaryPageNumber
            ) {
              return
            }

            set({
              loadedSecondaryPdfPage: null,

              secondaryPageLoadStatus:
                AsyncStatus.ERROR,

              secondaryPageLoadErrorMessage:
                getErrorMessage(
                  error,
                  'Não foi possível carregar a próxima página.',
                ),
            })
          }
        },

      clearSecondaryPdfPage: () => {
        ++secondaryPageLoadOperationSequence

        set({
          loadedSecondaryPdfPage: null,

          secondaryPageLoadStatus:
            AsyncStatus.IDLE,

          secondaryPageLoadErrorMessage: null,
        })
      },

      loadInitialContinuousPdfPages:
        async () => {
          const operationId =
            ++continuousPagesLoadOperationSequence

          const currentState = get()

          const {
            openedBook,
            loadedPdfDocument,
            currentPage,
          } = currentState

          if (
            openedBook === null ||
            loadedPdfDocument === null ||
            loadedPdfDocument.isClosed
          ) {
            set({
              ...createContinuousPdfPagesState(
                [],
                0,
              ),

              continuousPagesLoadStatus:
                AsyncStatus.ERROR,

              continuousPagesLoadErrorMessage:
                'Nenhum documento PDF está aberto para iniciar a rolagem contínua.',
            })

            return
          }

          const openedBookId =
            openedBook.book.id

          const totalPages =
            openedBook.book.totalPages

          const startPage =
            normalizeCurrentPage(
              currentPage,
              totalPages,
            )

          set({
            ...createContinuousPdfPagesState(
              [],
              totalPages,
            ),

            continuousPagesLoadStatus:
              AsyncStatus.LOADING,

            continuousPagesLoadErrorMessage: null,
          })

          try {
            const result =
              await applicationContainer
                .controllers
                .loadPdfPageBatch
                .execute({
                  document:
                    loadedPdfDocument.document,

                  startPage,

                  batchSize:
                    CONTINUOUS_PAGE_BATCH_SIZE,

                  totalPages,
                })

            if (
              operationId !==
              continuousPagesLoadOperationSequence
            ) {
              return
            }

            const latestState = get()

            if (
              latestState
                .loadedPdfDocument !==
                loadedPdfDocument ||
              loadedPdfDocument.isClosed ||
              latestState
                .openedBook
                ?.book
                .id !== openedBookId
            ) {
              return
            }

            set({
              ...createContinuousPdfPagesState(
                result.pages,
                totalPages,
              ),

              continuousPagesLoadStatus:
                AsyncStatus.SUCCESS,

              continuousPagesLoadErrorMessage: null,
            })
          } catch (error) {
            if (
              operationId !==
              continuousPagesLoadOperationSequence
            ) {
              return
            }

            const latestState = get()

            if (
              latestState
                .loadedPdfDocument !==
                loadedPdfDocument ||
              loadedPdfDocument.isClosed ||
              latestState
                .openedBook
                ?.book
                .id !== openedBookId
            ) {
              return
            }

            set({
              ...createContinuousPdfPagesState(
                [],
                totalPages,
              ),

              continuousPagesLoadStatus:
                AsyncStatus.ERROR,

              continuousPagesLoadErrorMessage:
                getErrorMessage(
                  error,
                  'Não foi possível carregar as páginas iniciais da rolagem contínua.',
                ),
            })
          }
        },

      loadInitialThumbnailPdfPages:
        async () => {
          const operationId =
            ++thumbnailPagesLoadOperationSequence

          const currentState = get()

          const {
            openedBook,
            loadedPdfDocument,
            currentPage,
          } = currentState

          if (
            openedBook === null ||
            loadedPdfDocument === null ||
            loadedPdfDocument.isClosed
          ) {
            set({
              ...createThumbnailPdfPagesState(
                [],
                0,
              ),

              thumbnailPagesLoadStatus:
                AsyncStatus.ERROR,

              thumbnailPagesLoadErrorMessage:
                'Nenhum documento PDF está aberto para carregar as miniaturas.',
            })

            return
          }

          const openedBookId =
            openedBook.book.id

          const totalPages =
            openedBook.book.totalPages

          const startPage =
            normalizeCurrentPage(
              currentPage,
              totalPages,
            )

          set({
            ...createThumbnailPdfPagesState(
              [],
              totalPages,
            ),

            thumbnailPagesLoadStatus:
              AsyncStatus.LOADING,

            thumbnailPagesLoadErrorMessage: null,
          })

          try {
            const result =
              await applicationContainer
                .controllers
                .loadPdfPageBatch
                .execute({
                  document:
                    loadedPdfDocument.document,

                  startPage,

                  batchSize:
                    THUMBNAIL_PAGE_BATCH_SIZE,

                  totalPages,
                })

            if (
              operationId !==
              thumbnailPagesLoadOperationSequence
            ) {
              return
            }

            const latestState = get()

            if (
              latestState
                .loadedPdfDocument !==
                loadedPdfDocument ||
              loadedPdfDocument.isClosed ||
              latestState
                .openedBook
                ?.book
                .id !== openedBookId
            ) {
              return
            }

            set({
              ...createThumbnailPdfPagesState(
                result.pages,
                totalPages,
              ),

              thumbnailPagesLoadStatus:
                AsyncStatus.SUCCESS,

              thumbnailPagesLoadErrorMessage: null,
            })
          } catch (error) {
            if (
              operationId !==
              thumbnailPagesLoadOperationSequence
            ) {
              return
            }

            const latestState = get()

            if (
              latestState
                .loadedPdfDocument !==
                loadedPdfDocument ||
              loadedPdfDocument.isClosed ||
              latestState
                .openedBook
                ?.book
                .id !== openedBookId
            ) {
              return
            }

            set({
              ...createThumbnailPdfPagesState(
                [],
                totalPages,
              ),

              thumbnailPagesLoadStatus:
                AsyncStatus.ERROR,

              thumbnailPagesLoadErrorMessage:
                getErrorMessage(
                  error,
                  'Não foi possível carregar as miniaturas iniciais.',
                ),
            })
          }
        },

      loadPreviousContinuousPdfPages:
        async () => {
          const currentState = get()

          if (
            currentState
              .continuousPagesLoadStatus ===
            AsyncStatus.LOADING
          ) {
            return
          }

          const {
            openedBook,
            loadedPdfDocument,
            loadedContinuousPdfPages,
            continuousPagesStartPage,
            continuousHasPreviousPages,
          } = currentState

          if (
            openedBook === null ||
            loadedPdfDocument === null ||
            loadedPdfDocument.isClosed
          ) {
            set({
              continuousPagesLoadStatus:
                AsyncStatus.ERROR,

              continuousPagesLoadErrorMessage:
                'Nenhum documento PDF está aberto para carregar páginas anteriores.',
            })

            return
          }

          if (
            continuousPagesStartPage ===
              null ||
            loadedContinuousPdfPages
              .length === 0
          ) {
            await get()
              .loadInitialContinuousPdfPages()

            return
          }

          if (
            !continuousHasPreviousPages
          ) {
            set({
              continuousPagesLoadStatus:
                AsyncStatus.SUCCESS,

              continuousPagesLoadErrorMessage: null,
            })

            return
          }

          const operationId =
            ++continuousPagesLoadOperationSequence

          const openedBookId =
            openedBook.book.id

          const totalPages =
            openedBook.book.totalPages

          const capturedStartPage =
            continuousPagesStartPage

          const batchStartPage =
            Math.max(
              1,
              capturedStartPage -
                CONTINUOUS_PAGE_BATCH_SIZE,
            )

          const batchSize =
            capturedStartPage -
            batchStartPage

          set({
            continuousPagesLoadStatus:
              AsyncStatus.LOADING,

            continuousPagesLoadErrorMessage: null,
          })

          try {
            const result =
              await applicationContainer
                .controllers
                .loadPdfPageBatch
                .execute({
                  document:
                    loadedPdfDocument.document,

                  startPage:
                    batchStartPage,

                  batchSize,

                  totalPages,
                })

            if (
              operationId !==
              continuousPagesLoadOperationSequence
            ) {
              return
            }

            const latestState = get()

            if (
              latestState
                .loadedPdfDocument !==
                loadedPdfDocument ||
              loadedPdfDocument.isClosed ||
              latestState
                .openedBook
                ?.book
                .id !== openedBookId
            ) {
              return
            }

            const mergedPages =
              mergePdfPages(
                latestState
                  .loadedContinuousPdfPages,
                result.pages,
              )

            set({
              ...createContinuousPdfPagesState(
                mergedPages,
                totalPages,
              ),

              continuousPagesLoadStatus:
                AsyncStatus.SUCCESS,

              continuousPagesLoadErrorMessage: null,
            })
          } catch (error) {
            if (
              operationId !==
              continuousPagesLoadOperationSequence
            ) {
              return
            }

            const latestState = get()

            if (
              latestState
                .loadedPdfDocument !==
                loadedPdfDocument ||
              loadedPdfDocument.isClosed ||
              latestState
                .openedBook
                ?.book
                .id !== openedBookId
            ) {
              return
            }

            set({
              continuousPagesLoadStatus:
                AsyncStatus.ERROR,

              continuousPagesLoadErrorMessage:
                getErrorMessage(
                  error,
                  'Não foi possível carregar as páginas anteriores.',
                ),
            })
          }
        },

      loadPreviousThumbnailPdfPages:
        async () => {
          const currentState = get()

          if (
            currentState
              .thumbnailPagesLoadStatus ===
            AsyncStatus.LOADING
          ) {
            return
          }

          const {
            openedBook,
            loadedPdfDocument,
            loadedThumbnailPdfPages,
            thumbnailPagesStartPage,
            thumbnailHasPreviousPages,
          } = currentState

          if (
            openedBook === null ||
            loadedPdfDocument === null ||
            loadedPdfDocument.isClosed
          ) {
            set({
              thumbnailPagesLoadStatus:
                AsyncStatus.ERROR,

              thumbnailPagesLoadErrorMessage:
                'Nenhum documento PDF está aberto para carregar páginas anteriores.',
            })

            return
          }

          if (
            thumbnailPagesStartPage ===
              null ||
            loadedThumbnailPdfPages
              .length === 0
          ) {
            await get()
              .loadInitialThumbnailPdfPages()

            return
          }

          if (
            !thumbnailHasPreviousPages
          ) {
            set({
              thumbnailPagesLoadStatus:
                AsyncStatus.SUCCESS,

              thumbnailPagesLoadErrorMessage: null,
            })

            return
          }

          const operationId =
            ++thumbnailPagesLoadOperationSequence

          const openedBookId =
            openedBook.book.id

          const totalPages =
            openedBook.book.totalPages

          const capturedStartPage =
            thumbnailPagesStartPage

          const batchStartPage =
            Math.max(
              1,
              capturedStartPage -
                THUMBNAIL_PAGE_BATCH_SIZE,
            )

          const batchSize =
            capturedStartPage -
            batchStartPage

          set({
            thumbnailPagesLoadStatus:
              AsyncStatus.LOADING,

            thumbnailPagesLoadErrorMessage: null,
          })

          try {
            const result =
              await applicationContainer
                .controllers
                .loadPdfPageBatch
                .execute({
                  document:
                    loadedPdfDocument.document,

                  startPage:
                    batchStartPage,

                  batchSize,

                  totalPages,
                })

            if (
              operationId !==
              thumbnailPagesLoadOperationSequence
            ) {
              return
            }

            const latestState = get()

            if (
              latestState
                .loadedPdfDocument !==
                loadedPdfDocument ||
              loadedPdfDocument.isClosed ||
              latestState
                .openedBook
                ?.book
                .id !== openedBookId
            ) {
              return
            }

            const mergedPages =
              mergePdfPages(
                latestState
                  .loadedThumbnailPdfPages,
                result.pages,
              )

            set({
              ...createThumbnailPdfPagesState(
                mergedPages,
                totalPages,
              ),

              thumbnailPagesLoadStatus:
                AsyncStatus.SUCCESS,

              thumbnailPagesLoadErrorMessage: null,
            })
          } catch (error) {
            if (
              operationId !==
              thumbnailPagesLoadOperationSequence
            ) {
              return
            }

            const latestState = get()

            if (
              latestState
                .loadedPdfDocument !==
                loadedPdfDocument ||
              loadedPdfDocument.isClosed ||
              latestState
                .openedBook
                ?.book
                .id !== openedBookId
            ) {
              return
            }

            set({
              thumbnailPagesLoadStatus:
                AsyncStatus.ERROR,

              thumbnailPagesLoadErrorMessage:
                getErrorMessage(
                  error,
                  'Não foi possível carregar as páginas anteriores.',
                ),
            })
          }
        },

      loadNextContinuousPdfPages:
        async () => {
          const currentState = get()

          if (
            currentState
              .continuousPagesLoadStatus ===
            AsyncStatus.LOADING
          ) {
            return
          }

          const {
            openedBook,
            loadedPdfDocument,
            loadedContinuousPdfPages,
            continuousPagesEndPage,
            continuousHasNextPages,
          } = currentState

          if (
            openedBook === null ||
            loadedPdfDocument === null ||
            loadedPdfDocument.isClosed
          ) {
            set({
              continuousPagesLoadStatus:
                AsyncStatus.ERROR,

              continuousPagesLoadErrorMessage:
                'Nenhum documento PDF está aberto para carregar as próximas páginas.',
            })

            return
          }

          if (
            continuousPagesEndPage ===
              null ||
            loadedContinuousPdfPages
              .length === 0
          ) {
            await get()
              .loadInitialContinuousPdfPages()

            return
          }

          if (!continuousHasNextPages) {
            set({
              continuousPagesLoadStatus:
                AsyncStatus.SUCCESS,

              continuousPagesLoadErrorMessage: null,
            })

            return
          }

          const operationId =
            ++continuousPagesLoadOperationSequence

          const openedBookId =
            openedBook.book.id

          const totalPages =
            openedBook.book.totalPages

          const startPage =
            continuousPagesEndPage + 1

          set({
            continuousPagesLoadStatus:
              AsyncStatus.LOADING,

            continuousPagesLoadErrorMessage: null,
          })

          try {
            const result =
              await applicationContainer
                .controllers
                .loadPdfPageBatch
                .execute({
                  document:
                    loadedPdfDocument.document,

                  startPage,

                  batchSize:
                    CONTINUOUS_PAGE_BATCH_SIZE,

                  totalPages,
                })

            if (
              operationId !==
              continuousPagesLoadOperationSequence
            ) {
              return
            }

            const latestState = get()

            if (
              latestState
                .loadedPdfDocument !==
                loadedPdfDocument ||
              loadedPdfDocument.isClosed ||
              latestState
                .openedBook
                ?.book
                .id !== openedBookId
            ) {
              return
            }

            const mergedPages =
              mergePdfPages(
                latestState
                  .loadedContinuousPdfPages,
                result.pages,
              )

            set({
              ...createContinuousPdfPagesState(
                mergedPages,
                totalPages,
              ),

              continuousPagesLoadStatus:
                AsyncStatus.SUCCESS,

              continuousPagesLoadErrorMessage: null,
            })
          } catch (error) {
            if (
              operationId !==
              continuousPagesLoadOperationSequence
            ) {
              return
            }

            const latestState = get()

            if (
              latestState
                .loadedPdfDocument !==
                loadedPdfDocument ||
              loadedPdfDocument.isClosed ||
              latestState
                .openedBook
                ?.book
                .id !== openedBookId
            ) {
              return
            }

            set({
              continuousPagesLoadStatus:
                AsyncStatus.ERROR,

              continuousPagesLoadErrorMessage:
                getErrorMessage(
                  error,
                  'Não foi possível carregar as próximas páginas.',
                ),
            })
          }
        },

      loadNextThumbnailPdfPages:
        async () => {
          const currentState = get()

          if (
            currentState
              .thumbnailPagesLoadStatus ===
            AsyncStatus.LOADING
          ) {
            return
          }

          const {
            openedBook,
            loadedPdfDocument,
            loadedThumbnailPdfPages,
            thumbnailPagesEndPage,
            thumbnailHasNextPages,
          } = currentState

          if (
            openedBook === null ||
            loadedPdfDocument === null ||
            loadedPdfDocument.isClosed
          ) {
            set({
              thumbnailPagesLoadStatus:
                AsyncStatus.ERROR,

              thumbnailPagesLoadErrorMessage:
                'Nenhum documento PDF está aberto para carregar as próximas páginas.',
            })

            return
          }

          if (
            thumbnailPagesEndPage ===
              null ||
            loadedThumbnailPdfPages
              .length === 0
          ) {
            await get()
              .loadInitialThumbnailPdfPages()

            return
          }

          if (!thumbnailHasNextPages) {
            set({
              thumbnailPagesLoadStatus:
                AsyncStatus.SUCCESS,

              thumbnailPagesLoadErrorMessage: null,
            })

            return
          }

          const operationId =
            ++thumbnailPagesLoadOperationSequence

          const openedBookId =
            openedBook.book.id

          const totalPages =
            openedBook.book.totalPages

          const startPage =
            thumbnailPagesEndPage + 1

          set({
            thumbnailPagesLoadStatus:
              AsyncStatus.LOADING,

            thumbnailPagesLoadErrorMessage: null,
          })

          try {
            const result =
              await applicationContainer
                .controllers
                .loadPdfPageBatch
                .execute({
                  document:
                    loadedPdfDocument.document,

                  startPage,

                  batchSize:
                    THUMBNAIL_PAGE_BATCH_SIZE,

                  totalPages,
                })

            if (
              operationId !==
              thumbnailPagesLoadOperationSequence
            ) {
              return
            }

            const latestState = get()

            if (
              latestState
                .loadedPdfDocument !==
                loadedPdfDocument ||
              loadedPdfDocument.isClosed ||
              latestState
                .openedBook
                ?.book
                .id !== openedBookId
            ) {
              return
            }

            const mergedPages =
              mergePdfPages(
                latestState
                  .loadedThumbnailPdfPages,
                result.pages,
              )

            set({
              ...createThumbnailPdfPagesState(
                mergedPages,
                totalPages,
              ),

              thumbnailPagesLoadStatus:
                AsyncStatus.SUCCESS,

              thumbnailPagesLoadErrorMessage: null,
            })
          } catch (error) {
            if (
              operationId !==
              thumbnailPagesLoadOperationSequence
            ) {
              return
            }

            const latestState = get()

            if (
              latestState
                .loadedPdfDocument !==
                loadedPdfDocument ||
              loadedPdfDocument.isClosed ||
              latestState
                .openedBook
                ?.book
                .id !== openedBookId
            ) {
              return
            }

            set({
              thumbnailPagesLoadStatus:
                AsyncStatus.ERROR,

              thumbnailPagesLoadErrorMessage:
                getErrorMessage(
                  error,
                  'Não foi possível carregar as próximas páginas.',
                ),
            })
          }
        },

      clearContinuousPdfPages: () => {
        ++continuousPagesLoadOperationSequence

        const totalPages =
          get().openedBook
            ?.book
            .totalPages ?? 0

        set({
          ...createContinuousPdfPagesState(
            [],
            totalPages,
          ),

          continuousPagesLoadStatus:
            AsyncStatus.IDLE,

          continuousPagesLoadErrorMessage: null,
        })
      },

      clearThumbnailPdfPages: () => {
        ++thumbnailPagesLoadOperationSequence

        const totalPages =
          get().openedBook
            ?.book
            .totalPages ?? 0

        set({
          ...createThumbnailPdfPagesState(
            [],
            totalPages,
          ),

          thumbnailPagesLoadStatus:
            AsyncStatus.IDLE,

          thumbnailPagesLoadErrorMessage: null,
        })
      },

      setReadingPosition: (
        currentPage,
        pageOffsetRatio,
      ) => {
        const openedBook =
          get().openedBook

        if (openedBook === null) {
          return
        }

        set({
          currentPage:
            normalizeCurrentPage(
              currentPage,
              openedBook
                .book
                .totalPages,
            ),

          pageOffsetRatio:
            normalizePageOffsetRatio(
              pageOffsetRatio,
            ),
        })
      },

      saveReadingProgress:
        async () => {
          const {
            openedBook,
            currentPage,
            pageOffsetRatio,
          } = get()

          if (openedBook === null) {
            set({
              progressSaveStatus:
                AsyncStatus.ERROR,

              readerErrorMessage:
                'Nenhum livro está aberto para salvar o progresso.',
            })

            return
          }

          const openedBookId =
            openedBook.book.id

          set({
            progressSaveStatus:
              AsyncStatus.LOADING,

            readerErrorMessage: null,
          })

          try {
            const readingProgress =
              await applicationContainer
                .controllers
                .saveReadingProgress
                .execute({
                  bookId:
                    openedBookId,

                  currentPage,
                  pageOffsetRatio,
                })

            const currentOpenedBook =
              get().openedBook

            if (
              currentOpenedBook
                ?.book
                .id !== openedBookId
            ) {
              return
            }

            set({
              openedBook: {
                ...currentOpenedBook,
                readingProgress,
              },

              progressSaveStatus:
                AsyncStatus.SUCCESS,
            })
          } catch (error) {
            if (
              get()
                .openedBook
                ?.book
                .id !== openedBookId
            ) {
              return
            }

            set({
              progressSaveStatus:
                AsyncStatus.ERROR,

              readerErrorMessage:
                getErrorMessage(
                  error,
                  'Não foi possível salvar o progresso de leitura.',
                ),
            })
          }
        },

      loadBookmarks: async () => {
        if (
          get().bookmarkMutationStatus ===
          AsyncStatus.LOADING
        ) {
          return
        }

        const operationId =
          ++bookmarkLoadOperationSequence

        const openedBook =
          get().openedBook

        if (openedBook === null) {
          set({
            bookmarks: [],

            bookmarksLoadStatus:
              AsyncStatus.IDLE,

            bookmarkErrorMessage: null,
          })

          return
        }

        const openedBookId =
          openedBook.book.id

        set({
          bookmarksLoadStatus:
            AsyncStatus.LOADING,

          bookmarkErrorMessage: null,
        })

        try {
          const bookmarks =
            await applicationContainer
              .controllers
              .loadBookmarks
              .execute(openedBookId)

          if (
            operationId !==
            bookmarkLoadOperationSequence
          ) {
            return
          }

          if (
            get().openedBook?.book.id !==
            openedBookId
          ) {
            return
          }

          set({
            bookmarks,

            bookmarksLoadStatus:
              AsyncStatus.SUCCESS,

            bookmarkErrorMessage: null,
          })
        } catch (error) {
          if (
            operationId !==
            bookmarkLoadOperationSequence
          ) {
            return
          }

          if (
            get().openedBook?.book.id !==
            openedBookId
          ) {
            return
          }

          set({
            bookmarksLoadStatus:
              AsyncStatus.ERROR,

            bookmarkErrorMessage:
              getErrorMessage(
                error,
                'Não foi possível carregar os favoritos deste livro.',
              ),
          })
        }
      },

      createCurrentPageBookmark:
        async () => {
          const currentState = get()

          if (
            currentState
              .bookmarkMutationStatus ===
            AsyncStatus.LOADING
          ) {
            return
          }

          const openedBook =
            currentState.openedBook

          if (openedBook === null) {
            set({
              bookmarkMutationStatus:
                AsyncStatus.ERROR,

              bookmarkErrorMessage:
                'Nenhum livro está aberto para criar um favorito.',
            })

            return
          }

          const operationId =
            ++bookmarkMutationOperationSequence

          ++bookmarkLoadOperationSequence

          const openedBookId =
            openedBook.book.id

          const pageNumber =
            currentState.currentPage

          const pageOffsetRatio =
            currentState.pageOffsetRatio

          set({
            bookmarkMutationStatus:
              AsyncStatus.LOADING,

            bookmarkErrorMessage: null,
          })

          try {
            const bookmark =
              await applicationContainer
                .controllers
                .createBookmark
                .execute({
                  bookId:
                    openedBookId,

                  pageNumber,
                  pageOffsetRatio,
                })

            if (
              operationId !==
              bookmarkMutationOperationSequence
            ) {
              return
            }

            const latestState = get()

            if (
              latestState
                .openedBook
                ?.book
                .id !== openedBookId
            ) {
              return
            }

            set({
              bookmarks:
                mergeBookmark(
                  latestState.bookmarks,
                  bookmark,
                ),

              bookmarksLoadStatus:
                AsyncStatus.SUCCESS,

              bookmarkMutationStatus:
                AsyncStatus.SUCCESS,

              bookmarkErrorMessage: null,
            })
          } catch (error) {
            if (
              operationId !==
              bookmarkMutationOperationSequence
            ) {
              return
            }

            if (
              get().openedBook?.book.id !==
              openedBookId
            ) {
              return
            }

            set({
              bookmarkMutationStatus:
                AsyncStatus.ERROR,

              bookmarkErrorMessage:
                getErrorMessage(
                  error,
                  'Não foi possível adicionar esta página aos favoritos.',
                ),
            })
          }
        },

      deleteBookmark: async (
        bookmarkId,
      ) => {
        const currentState = get()

        if (
          currentState
            .bookmarkMutationStatus ===
          AsyncStatus.LOADING
        ) {
          return
        }

        const openedBook =
          currentState.openedBook

        if (openedBook === null) {
          set({
            bookmarkMutationStatus:
              AsyncStatus.ERROR,

            bookmarkErrorMessage:
              'Nenhum livro está aberto para remover o favorito.',
          })

          return
        }

        const operationId =
          ++bookmarkMutationOperationSequence

        ++bookmarkLoadOperationSequence

        const openedBookId =
          openedBook.book.id

        set({
          bookmarkMutationStatus:
            AsyncStatus.LOADING,

          bookmarkErrorMessage: null,
        })

        try {
          await applicationContainer
            .controllers
            .deleteBookmark
            .execute(bookmarkId)

          if (
            operationId !==
            bookmarkMutationOperationSequence
          ) {
            return
          }

          const latestState = get()

          if (
            latestState
              .openedBook
              ?.book
              .id !== openedBookId
          ) {
            return
          }

          set({
            bookmarks:
              latestState.bookmarks.filter(
                (bookmark) =>
                  bookmark.id !==
                  bookmarkId,
              ),

            bookmarksLoadStatus:
              AsyncStatus.SUCCESS,

            bookmarkMutationStatus:
              AsyncStatus.SUCCESS,

            bookmarkErrorMessage: null,
          })
        } catch (error) {
          if (
            operationId !==
            bookmarkMutationOperationSequence
          ) {
            return
          }

          if (
            get().openedBook?.book.id !==
            openedBookId
          ) {
            return
          }

          set({
            bookmarkMutationStatus:
              AsyncStatus.ERROR,

            bookmarkErrorMessage:
              getErrorMessage(
                error,
                'Não foi possível remover o favorito.',
              ),
          })
        }
      },

      clearReaderError: () => {
        set({
          readerErrorMessage: null,
        })
      },

      clearPageLoadError: () => {
        set({
          pageLoadErrorMessage: null,
        })
      },

      clearSecondaryPageLoadError: () => {
        set({
          secondaryPageLoadErrorMessage: null,
        })
      },

      clearThumbnailPagesLoadError: () => {
        set({
          thumbnailPagesLoadErrorMessage: null,
        })
      },

      clearContinuousPagesLoadError: () => {
        set({
          continuousPagesLoadErrorMessage: null,
        })
      },

      clearBookmarkError: () => {
        set({
          bookmarkErrorMessage: null,
        })
      },
    }
  }
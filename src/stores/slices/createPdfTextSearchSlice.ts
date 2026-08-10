import type {
  StateCreator,
} from 'zustand'

import {
  applicationContainer,
} from '@/app/providers/applicationContainer'
import {
  AsyncStatus,
} from '@/models/enums/AsyncStatus'
import type {
  AppStore,
  PdfTextSearchSlice,
} from '@/stores/appStore.types'
import {
  getErrorMessage,
} from '@/utils/errors/getErrorMessage'

type PdfTextSearchSliceCreator =
  StateCreator<
    AppStore,
    [],
    [],
    PdfTextSearchSlice
  >

export const createPdfTextSearchSlice:
  PdfTextSearchSliceCreator = (
    set,
    get,
  ) => {
    let searchOperationSequence = 0

    return {
      pdfTextSearchQuery:
        '',

      pdfTextSearchResult:
        null,

      pdfTextSearchStatus:
        AsyncStatus.IDLE,

      pdfTextSearchCompletedPages:
        0,

      pdfTextSearchTotalPages:
        0,

      pdfTextSearchErrorMessage:
        null,

      searchPdfText:
        async (
          query,
        ) => {
          const operationId =
            ++searchOperationSequence

          const loadedPdfDocument =
            get().loadedPdfDocument

          if (
            loadedPdfDocument ===
              null ||
            loadedPdfDocument.isClosed
          ) {
            set({
              pdfTextSearchQuery:
                query.trim(),

              pdfTextSearchResult:
                null,

              pdfTextSearchStatus:
                AsyncStatus.ERROR,

              pdfTextSearchCompletedPages:
                0,

              pdfTextSearchTotalPages:
                0,

              pdfTextSearchErrorMessage:
                'Nenhum documento PDF está aberto para realizar a pesquisa.',
            })

            return
          }

          const normalizedQuery =
            query.trim()

          const totalPages =
            Math.max(
              0,
              Math.trunc(
                loadedPdfDocument
                  .document
                  .numPages,
              ),
            )

          set({
            pdfTextSearchQuery:
              normalizedQuery,

            pdfTextSearchResult:
              null,

            pdfTextSearchStatus:
              AsyncStatus.LOADING,

            pdfTextSearchCompletedPages:
              0,

            pdfTextSearchTotalPages:
              totalPages,

            pdfTextSearchErrorMessage:
              null,
          })

          try {
            const result =
              await applicationContainer
                .controllers
                .searchPdfText
                .execute(
                  loadedPdfDocument
                    .document,

                  normalizedQuery,

                  {
                    onProgress: (
                      progress,
                    ) => {
                      if (
                        operationId !==
                        searchOperationSequence
                      ) {
                        return
                      }

                      const currentState =
                        get()

                      if (
                        currentState
                          .loadedPdfDocument !==
                          loadedPdfDocument ||
                        loadedPdfDocument
                          .isClosed
                      ) {
                        return
                      }

                      set({
                        pdfTextSearchCompletedPages:
                          progress
                            .completedPages,

                        pdfTextSearchTotalPages:
                          progress
                            .totalPages,
                      })
                    },
                  },
                )

            if (
              operationId !==
              searchOperationSequence
            ) {
              return
            }

            const currentState =
              get()

            if (
              currentState
                .loadedPdfDocument !==
                loadedPdfDocument ||
              loadedPdfDocument.isClosed
            ) {
              return
            }

            set({
              pdfTextSearchQuery:
                result.query,

              pdfTextSearchResult:
                result,

              pdfTextSearchStatus:
                AsyncStatus.SUCCESS,

              pdfTextSearchCompletedPages:
                result
                  .totalPagesSearched,

              pdfTextSearchTotalPages:
                result
                  .totalPagesSearched,

              pdfTextSearchErrorMessage:
                null,
            })
          } catch (error) {
            if (
              operationId !==
              searchOperationSequence
            ) {
              return
            }

            if (
              get()
                .loadedPdfDocument !==
                loadedPdfDocument ||
              loadedPdfDocument.isClosed
            ) {
              return
            }

            set({
              pdfTextSearchResult:
                null,

              pdfTextSearchStatus:
                AsyncStatus.ERROR,

              pdfTextSearchErrorMessage:
                getErrorMessage(
                  error,
                  'Não foi possível pesquisar o texto deste documento.',
                ),
            })
          }
        },

      clearPdfTextSearch:
        () => {
          ++searchOperationSequence

          set({
            pdfTextSearchQuery:
              '',

            pdfTextSearchResult:
              null,

            pdfTextSearchStatus:
              AsyncStatus.IDLE,

            pdfTextSearchCompletedPages:
              0,

            pdfTextSearchTotalPages:
              0,

            pdfTextSearchErrorMessage:
              null,
          })
        },

      clearPdfTextSearchError:
        () => {
          set({
            pdfTextSearchErrorMessage:
              null,
          })
        },
    }
  }
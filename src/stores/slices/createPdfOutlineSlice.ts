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
  PdfOutlineSlice,
} from '@/stores/appStore.types'
import {
  getErrorMessage,
} from '@/utils/errors/getErrorMessage'

type PdfOutlineSliceCreator =
  StateCreator<
    AppStore,
    [],
    [],
    PdfOutlineSlice
  >

export const createPdfOutlineSlice:
  PdfOutlineSliceCreator = (
    set,
    get,
  ) => {
    let loadOperationSequence = 0

    return {
      pdfOutlineItems:
        [],

      pdfOutlineStatus:
        AsyncStatus.IDLE,

      pdfOutlineErrorMessage:
        null,

      loadPdfOutline:
        async () => {
          const operationId =
            ++loadOperationSequence

          const loadedPdfDocument =
            get().loadedPdfDocument

          if (
            loadedPdfDocument ===
              null ||
            loadedPdfDocument.isClosed
          ) {
            set({
              pdfOutlineItems:
                [],

              pdfOutlineStatus:
                AsyncStatus.ERROR,

              pdfOutlineErrorMessage:
                'Nenhum documento PDF está aberto para carregar o sumário.',
            })

            return
          }

          set({
            pdfOutlineItems:
              [],

            pdfOutlineStatus:
              AsyncStatus.LOADING,

            pdfOutlineErrorMessage:
              null,
          })

          try {
            const items =
              await applicationContainer
                .controllers
                .loadPdfOutline
                .execute(
                  loadedPdfDocument
                    .document,
                )

            if (
              operationId !==
              loadOperationSequence
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
              pdfOutlineItems:
                items,

              pdfOutlineStatus:
                AsyncStatus.SUCCESS,

              pdfOutlineErrorMessage:
                null,
            })
          } catch (error) {
            if (
              operationId !==
              loadOperationSequence
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
              pdfOutlineItems:
                [],

              pdfOutlineStatus:
                AsyncStatus.ERROR,

              pdfOutlineErrorMessage:
                getErrorMessage(
                  error,
                  'Não foi possível carregar o sumário deste documento.',
                ),
            })
          }
        },

      clearPdfOutline:
        () => {
          ++loadOperationSequence

          set({
            pdfOutlineItems:
              [],

            pdfOutlineStatus:
              AsyncStatus.IDLE,

            pdfOutlineErrorMessage:
              null,
          })
        },

      clearPdfOutlineError:
        () => {
          set({
            pdfOutlineErrorMessage:
              null,
          })
        },
    }
  }
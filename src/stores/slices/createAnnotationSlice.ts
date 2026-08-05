import type {
  StateCreator,
} from 'zustand'

import {
  applicationContainer,
} from '@/app/providers/applicationContainer'
import type {
  Annotation,
} from '@/models/entities/Annotation'
import {
  AsyncStatus,
} from '@/models/enums/AsyncStatus'
import type {
  AnnotationId,
} from '@/models/value-objects/AnnotationId'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  AnnotationSlice,
  AppStore,
} from '@/stores/appStore.types'
import {
  getErrorMessage,
} from '@/utils/errors/getErrorMessage'

type AnnotationSliceCreator =
  StateCreator<
    AppStore,
    [],
    [],
    AnnotationSlice
  >

function sortAnnotationsByPosition(
  annotations:
    readonly Annotation[],
): readonly Annotation[] {
  return [...annotations].sort(
    (
      firstAnnotation,
      secondAnnotation,
    ) => {
      const pageDifference =
        firstAnnotation.pageNumber -
        secondAnnotation.pageNumber

      if (pageDifference !== 0) {
        return pageDifference
      }

      const offsetDifference =
        firstAnnotation.pageOffsetRatio -
        secondAnnotation.pageOffsetRatio

      if (offsetDifference !== 0) {
        return offsetDifference
      }

      return firstAnnotation.createdAt.localeCompare(
        secondAnnotation.createdAt,
      )
    },
  )
}

function isCurrentOpenedBook(
  get: () => AppStore,
  bookId: BookId,
): boolean {
  return (
    get().openedBook?.book.id ===
    bookId
  )
}

function removeAnnotationById(
  annotations:
    readonly Annotation[],
  annotationId: AnnotationId,
): readonly Annotation[] {
  return annotations.filter(
    (annotation) =>
      annotation.id !==
      annotationId,
  )
}

export const createAnnotationSlice:
  AnnotationSliceCreator = (
    set,
    get,
  ) => {
    let loadOperationSequence = 0

    return {
      annotations: [],

      annotationsLoadStatus:
        AsyncStatus.IDLE,

      annotationMutationStatus:
        AsyncStatus.IDLE,

      annotationErrorMessage: null,

      loadAnnotations: async () => {
        const operationId =
          ++loadOperationSequence

        const openedBook =
          get().openedBook

        if (openedBook === null) {
          set({
            annotations: [],

            annotationsLoadStatus:
              AsyncStatus.ERROR,

            annotationErrorMessage:
              'Nenhum livro está aberto para carregar as anotações.',
          })

          return
        }

        const bookId =
          openedBook.book.id

        set({
          annotationsLoadStatus:
            AsyncStatus.LOADING,

          annotationErrorMessage: null,
        })

        try {
          const annotations =
            await applicationContainer
              .controllers
              .loadAnnotations
              .execute(
                bookId,
              )

          if (
            operationId !==
              loadOperationSequence ||
            !isCurrentOpenedBook(
              get,
              bookId,
            )
          ) {
            return
          }

          set({
            annotations,

            annotationsLoadStatus:
              AsyncStatus.SUCCESS,

            annotationErrorMessage: null,
          })
        } catch (error) {
          if (
            operationId !==
              loadOperationSequence ||
            !isCurrentOpenedBook(
              get,
              bookId,
            )
          ) {
            return
          }

          set({
            annotations: [],

            annotationsLoadStatus:
              AsyncStatus.ERROR,

            annotationErrorMessage:
              getErrorMessage(
                error,
                'Não foi possível carregar as anotações deste livro.',
              ),
          })
        }
      },

      createHighlightAnnotation:
        async (
          command,
        ) => {
          const openedBook =
            get().openedBook

          if (openedBook === null) {
            set({
              annotationMutationStatus:
                AsyncStatus.ERROR,

              annotationErrorMessage:
                'Nenhum livro está aberto para criar a marcação.',
            })

            return
          }

          const bookId =
            openedBook.book.id

          set({
            annotationMutationStatus:
              AsyncStatus.LOADING,

            annotationErrorMessage:
              null,
          })

          try {
            const annotation =
              await applicationContainer
                .controllers
                .createHighlightAnnotation
                .execute({
                  ...command,
                  bookId,
                })

            if (
              !isCurrentOpenedBook(
                get,
                bookId,
              )
            ) {
              return
            }

            set(
              (
                currentState,
              ) => ({
                annotations:
                  sortAnnotationsByPosition([
                    ...removeAnnotationById(
                      currentState.annotations,
                      annotation.id,
                    ),

                    annotation,
                  ]),

                annotationMutationStatus:
                  AsyncStatus.SUCCESS,

                annotationErrorMessage:
                  null,
              }),
            )
          } catch (error) {
            if (
              !isCurrentOpenedBook(
                get,
                bookId,
              )
            ) {
              return
            }

            set({
              annotationMutationStatus:
                AsyncStatus.ERROR,

              annotationErrorMessage:
                getErrorMessage(
                  error,
                  'Não foi possível salvar a marcação.',
                ),
            })
          }
        },

      createNoteAnnotation:
        async (
          command,
        ) => {
          const openedBook =
            get().openedBook

          if (openedBook === null) {
            set({
              annotationMutationStatus:
                AsyncStatus.ERROR,

              annotationErrorMessage:
                'Nenhum livro está aberto para criar a nota.',
            })

            return
          }

          const bookId =
            openedBook.book.id

          set({
            annotationMutationStatus:
              AsyncStatus.LOADING,

            annotationErrorMessage:
              null,
          })

          try {
            const annotation =
              await applicationContainer
                .controllers
                .createNoteAnnotation
                .execute({
                  ...command,
                  bookId,
                })

            if (
              !isCurrentOpenedBook(
                get,
                bookId,
              )
            ) {
              return
            }

            set(
              (
                currentState,
              ) => ({
                annotations:
                  sortAnnotationsByPosition([
                    ...removeAnnotationById(
                      currentState.annotations,
                      annotation.id,
                    ),

                    annotation,
                  ]),

                annotationMutationStatus:
                  AsyncStatus.SUCCESS,

                annotationErrorMessage:
                  null,
              }),
            )
          } catch (error) {
            if (
              !isCurrentOpenedBook(
                get,
                bookId,
              )
            ) {
              return
            }

            set({
              annotationMutationStatus:
                AsyncStatus.ERROR,

              annotationErrorMessage:
                getErrorMessage(
                  error,
                  'Não foi possível salvar a nota.',
                ),
            })
          }
        },

      deleteAnnotation: async (
        annotationId,
      ) => {
        const openedBook =
          get().openedBook

        if (openedBook === null) {
          set({
            annotationMutationStatus:
              AsyncStatus.ERROR,

            annotationErrorMessage:
              'Nenhum livro está aberto para excluir a anotação.',
          })

          return
        }

        const bookId =
          openedBook.book.id

        set({
          annotationMutationStatus:
            AsyncStatus.LOADING,

          annotationErrorMessage:
            null,
        })

        try {
          await applicationContainer
            .controllers
            .deleteAnnotation
            .execute(
              annotationId,
            )

          if (
            !isCurrentOpenedBook(
              get,
              bookId,
            )
          ) {
            return
          }

          set(
            (
              currentState,
            ) => ({
              annotations:
                removeAnnotationById(
                  currentState.annotations,
                  annotationId,
                ),

              annotationMutationStatus:
                AsyncStatus.SUCCESS,

              annotationErrorMessage:
                null,
            }),
          )
        } catch (error) {
          if (
            !isCurrentOpenedBook(
              get,
              bookId,
            )
          ) {
            return
          }

          set({
            annotationMutationStatus:
              AsyncStatus.ERROR,

            annotationErrorMessage:
              getErrorMessage(
                error,
                'Não foi possível excluir a anotação.',
              ),
          })
        }
      },

      clearAnnotationError: () => {
        set({
          annotationErrorMessage: null,
        })
      },
    }
  }

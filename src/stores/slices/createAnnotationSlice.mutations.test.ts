import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  applicationContainer,
} from '@/app/providers/applicationContainer'
import type {
  OpenBookResult,
} from '@/models/dtos/OpenBookResult'
import type {
  HighlightAnnotation,
  NoteAnnotation,
} from '@/models/entities/Annotation'
import {
  AnnotationColor,
} from '@/models/enums/AnnotationColor'
import {
  AnnotationType,
} from '@/models/enums/AnnotationType'
import {
  AsyncStatus,
} from '@/models/enums/AsyncStatus'
import type {
  AnnotationArea,
} from '@/models/value-objects/AnnotationArea'
import type {
  AnnotationId,
} from '@/models/value-objects/AnnotationId'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  IsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import {
  useAppStore,
} from '@/stores/useAppStore'

const FIRST_BOOK_ID =
  'annotation-mutations-book-1' as BookId

const SECOND_BOOK_ID =
  'annotation-mutations-book-2' as BookId

const FIRST_ANNOTATION_ID =
  'annotation-mutations-1' as AnnotationId

const SECOND_ANNOTATION_ID =
  'annotation-mutations-2' as AnnotationId

const TEST_DATE =
  '2026-08-10T10:00:00.000Z' as IsoDateTime

function createOpenedBook(
  bookId: BookId,
): OpenBookResult {
  return {
    book: {
      id:
        bookId,

      title:
        'Livro de teste',

      author:
        null,

      originalFileName:
        'livro-de-teste.pdf',

      fileSizeBytes:
        4,

      mimeType:
        'application/pdf',

      totalPages:
        20,

      pdfFingerprint:
        null,

      importedAt:
        TEST_DATE,

      updatedAt:
        TEST_DATE,

      lastOpenedAt:
        null,
    },

    bookFile: {
      bookId,

      file:
        new Blob(
          ['%PDF'],
          {
            type:
              'application/pdf',
          },
        ),

      storedAt:
        TEST_DATE,
    },

    readingProgress:
      null,
  }
}

function createNoteAnnotation({
  id,
  bookId = FIRST_BOOK_ID,
  pageNumber = 2,
  pageOffsetRatio = 0.3,
  content = 'Nota de teste',
}: {
  readonly id: AnnotationId
  readonly bookId?: BookId
  readonly pageNumber?: number
  readonly pageOffsetRatio?: number
  readonly content?: string
}): NoteAnnotation {
  return {
    id,
    bookId,

    pageNumber,
    pageOffsetRatio,

    type:
      AnnotationType.NOTE,

    content,

    createdAt:
      TEST_DATE,

    updatedAt:
      TEST_DATE,
  }
}

function createHighlightAnnotation({
  id,
  bookId = FIRST_BOOK_ID,
  pageNumber = 3,
  pageOffsetRatio = 0.4,
  color = AnnotationColor.YELLOW,
  selectedText = 'Texto selecionado',
  areas = [
    {
      left: 0.1,
      bottom: 0.2,
      right: 0.6,
      top: 0.4,
    },
  ],
}: {
  readonly id: AnnotationId
  readonly bookId?: BookId
  readonly pageNumber?: number
  readonly pageOffsetRatio?: number
  readonly color?: AnnotationColor
  readonly selectedText?: string
  readonly areas?: readonly AnnotationArea[]
}): HighlightAnnotation {
  return {
    id,
    bookId,

    pageNumber,
    pageOffsetRatio,

    type:
      AnnotationType.HIGHLIGHT,

    color,
    selectedText,
    areas,

    createdAt:
      TEST_DATE,

    updatedAt:
      TEST_DATE,
  }
}

function resetAnnotationState(): void {
  useAppStore.setState({
    openedBook:
      null,

    annotations:
      [],

    annotationsLoadStatus:
      AsyncStatus.IDLE,

    annotationMutationStatus:
      AsyncStatus.IDLE,

    annotationErrorMessage:
      null,
  })
}

describe(
  'createAnnotationSlice mutations',
  () => {
    beforeEach(
      () => {
        resetAnnotationState()
      },
    )

    afterEach(
      () => {
        vi.restoreAllMocks()

        resetAnnotationState()
      },
    )

    it(
      'informa erro ao criar marcação sem livro aberto',
      async () => {
        const createHighlightSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .createHighlightAnnotation,
            'execute',
          )

        await useAppStore
          .getState()
          .createHighlightAnnotation({
            pageNumber:
              3,

            pageOffsetRatio:
              0.4,

            color:
              AnnotationColor.YELLOW,

            selectedText:
              'Texto selecionado',

            areas: [
              {
                left: 0.1,
                bottom: 0.2,
                right: 0.6,
                top: 0.4,
              },
            ],
          })

        const state =
          useAppStore.getState()

        expect(
          state.annotationMutationStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )

        expect(
          state.annotationErrorMessage,
        ).toBe(
          'Nenhum livro está aberto para criar a marcação.',
        )

        expect(
          createHighlightSpy,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'cria uma marcação usando o livro atualmente aberto',
      async () => {
        const createdAnnotation =
          createHighlightAnnotation({
            id:
              FIRST_ANNOTATION_ID,
          })

        const createHighlightSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .createHighlightAnnotation,
            'execute',
          )
            .mockResolvedValue(
              createdAnnotation,
            )

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              FIRST_BOOK_ID,
            ),
        })

        const areas = [
          {
            left: 0.1,
            bottom: 0.2,
            right: 0.6,
            top: 0.4,
          },
        ]

        await useAppStore
          .getState()
          .createHighlightAnnotation({
            pageNumber:
              3,

            pageOffsetRatio:
              0.4,

            color:
              AnnotationColor.YELLOW,

            selectedText:
              'Texto selecionado',

            areas,
          })

        const state =
          useAppStore.getState()

        expect(
          createHighlightSpy,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          createHighlightSpy,
        ).toHaveBeenCalledWith({
          pageNumber:
            3,

          pageOffsetRatio:
            0.4,

          color:
            AnnotationColor.YELLOW,

          selectedText:
            'Texto selecionado',

          areas,

          bookId:
            FIRST_BOOK_ID,
        })

        expect(
          state.annotations,
        ).toEqual([
          createdAnnotation,
        ])

        expect(
          state.annotationMutationStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )

        expect(
          state.annotationErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'mantém as anotações ordenadas após criar uma marcação',
      async () => {
        const laterAnnotation =
          createNoteAnnotation({
            id:
              FIRST_ANNOTATION_ID,

            pageNumber:
              8,

            pageOffsetRatio:
              0.8,
          })

        const createdHighlight =
          createHighlightAnnotation({
            id:
              SECOND_ANNOTATION_ID,

            pageNumber:
              2,

            pageOffsetRatio:
              0.2,
          })

        vi.spyOn(
          applicationContainer
            .controllers
            .createHighlightAnnotation,
          'execute',
        )
          .mockResolvedValue(
            createdHighlight,
          )

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              FIRST_BOOK_ID,
            ),

          annotations: [
            laterAnnotation,
          ],
        })

        await useAppStore
          .getState()
          .createHighlightAnnotation({
            pageNumber:
              2,

            pageOffsetRatio:
              0.2,

            color:
              AnnotationColor.YELLOW,

            selectedText:
              'Texto anterior',

            areas: [
              {
                left: 0.1,
                bottom: 0.2,
                right: 0.6,
                top: 0.4,
              },
            ],
          })

        expect(
          useAppStore
            .getState()
            .annotations,
        ).toEqual([
          createdHighlight,
          laterAnnotation,
        ])
      },
    )

    it(
      'substitui uma marcação com o mesmo identificador sem duplicá-la',
      async () => {
        const originalAnnotation =
          createHighlightAnnotation({
            id:
              FIRST_ANNOTATION_ID,

            color:
              AnnotationColor.YELLOW,

            selectedText:
              'Texto antigo',
          })

        const updatedAnnotation =
          createHighlightAnnotation({
            id:
              FIRST_ANNOTATION_ID,

            color:
              AnnotationColor.GREEN,

            selectedText:
              'Texto atualizado',
          })

        vi.spyOn(
          applicationContainer
            .controllers
            .createHighlightAnnotation,
          'execute',
        )
          .mockResolvedValue(
            updatedAnnotation,
          )

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              FIRST_BOOK_ID,
            ),

          annotations: [
            originalAnnotation,
          ],
        })

        await useAppStore
          .getState()
          .createHighlightAnnotation({
            pageNumber:
              3,

            pageOffsetRatio:
              0.4,

            color:
              AnnotationColor.GREEN,

            selectedText:
              'Texto atualizado',

            areas:
              updatedAnnotation.areas,
          })

        expect(
          useAppStore
            .getState()
            .annotations,
        ).toEqual([
          updatedAnnotation,
        ])
      },
    )

    it(
      'registra erro quando a criação de marcação falha',
      async () => {
        const existingAnnotation =
          createNoteAnnotation({
            id:
              FIRST_ANNOTATION_ID,
          })

        vi.spyOn(
          applicationContainer
            .controllers
            .createHighlightAnnotation,
          'execute',
        )
          .mockRejectedValue(
            new Error(
              'Falha controlada na marcação.',
            ),
          )

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              FIRST_BOOK_ID,
            ),

          annotations: [
            existingAnnotation,
          ],
        })

        await useAppStore
          .getState()
          .createHighlightAnnotation({
            pageNumber:
              3,

            pageOffsetRatio:
              0.4,

            color:
              AnnotationColor.YELLOW,

            selectedText:
              'Texto selecionado',

            areas: [
              {
                left: 0.1,
                bottom: 0.2,
                right: 0.6,
                top: 0.4,
              },
            ],
          })

        const state =
          useAppStore.getState()

        expect(
          state.annotations,
        ).toEqual([
          existingAnnotation,
        ])

        expect(
          state.annotationMutationStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )

        expect(
          state.annotationErrorMessage,
        ).toBe(
          'Falha controlada na marcação.',
        )
      },
    )

    it(
      'registra erro quando a criação de nota falha',
      async () => {
        const existingAnnotation =
          createNoteAnnotation({
            id:
              FIRST_ANNOTATION_ID,
          })

        vi.spyOn(
          applicationContainer
            .controllers
            .createNoteAnnotation,
          'execute',
        )
          .mockRejectedValue(
            new Error(
              'Falha controlada na nota.',
            ),
          )

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              FIRST_BOOK_ID,
            ),

          annotations: [
            existingAnnotation,
          ],
        })

        await useAppStore
          .getState()
          .createNoteAnnotation({
            pageNumber:
              4,

            pageOffsetRatio:
              0.5,

            content:
              'Nova nota',
          })

        const state =
          useAppStore.getState()

        expect(
          state.annotations,
        ).toEqual([
          existingAnnotation,
        ])

        expect(
          state.annotationMutationStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )

        expect(
          state.annotationErrorMessage,
        ).toBe(
          'Falha controlada na nota.',
        )
      },
    )

    it(
      'informa erro ao excluir anotação sem livro aberto',
      async () => {
        const deleteAnnotationSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .deleteAnnotation,
            'execute',
          )

        await useAppStore
          .getState()
          .deleteAnnotation(
            FIRST_ANNOTATION_ID,
          )

        const state =
          useAppStore.getState()

        expect(
          state.annotationMutationStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )

        expect(
          state.annotationErrorMessage,
        ).toBe(
          'Nenhum livro está aberto para excluir a anotação.',
        )

        expect(
          deleteAnnotationSpy,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'preserva as anotações quando a exclusão falha',
      async () => {
        const existingAnnotation =
          createNoteAnnotation({
            id:
              FIRST_ANNOTATION_ID,
          })

        vi.spyOn(
          applicationContainer
            .controllers
            .deleteAnnotation,
          'execute',
        )
          .mockRejectedValue(
            new Error(
              'Falha controlada na exclusão.',
            ),
          )

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              FIRST_BOOK_ID,
            ),

          annotations: [
            existingAnnotation,
          ],
        })

        await useAppStore
          .getState()
          .deleteAnnotation(
            FIRST_ANNOTATION_ID,
          )

        const state =
          useAppStore.getState()

        expect(
          state.annotations,
        ).toEqual([
          existingAnnotation,
        ])

        expect(
          state.annotationMutationStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )

        expect(
          state.annotationErrorMessage,
        ).toBe(
          'Falha controlada na exclusão.',
        )
      },
    )

    it(
      'ignora uma nota concluída depois que outro livro foi aberto',
      async () => {
        let resolveCreate:
          (
            annotation:
              NoteAnnotation,
          ) => void =
          () => undefined

        const pendingCreate =
          new Promise<
            NoteAnnotation
          >(
            (resolve) => {
              resolveCreate =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .createNoteAnnotation,
          'execute',
        )
          .mockReturnValue(
            pendingCreate,
          )

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              FIRST_BOOK_ID,
            ),
        })

        const createPromise =
          useAppStore
            .getState()
            .createNoteAnnotation({
              pageNumber:
                2,

              pageOffsetRatio:
                0.3,

              content:
                'Nota do primeiro livro',
            })

        const secondBookAnnotation =
          createNoteAnnotation({
            id:
              SECOND_ANNOTATION_ID,

            bookId:
              SECOND_BOOK_ID,

            pageNumber:
              1,

            pageOffsetRatio:
              0.2,

            content:
              'Nota do segundo livro',
          })

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              SECOND_BOOK_ID,
            ),

          annotations: [
            secondBookAnnotation,
          ],
        })

        resolveCreate(
          createNoteAnnotation({
            id:
              FIRST_ANNOTATION_ID,

            bookId:
              FIRST_BOOK_ID,

            pageNumber:
              2,

            pageOffsetRatio:
              0.3,

            content:
              'Nota antiga',
          }),
        )

        await createPromise

        expect(
          useAppStore
            .getState()
            .annotations,
        ).toEqual([
          secondBookAnnotation,
        ])
      },
    )

    it(
      'ignora uma marcação concluída depois que outro livro foi aberto',
      async () => {
        let resolveCreate:
          (
            annotation:
              HighlightAnnotation,
          ) => void =
          () => undefined

        const pendingCreate =
          new Promise<
            HighlightAnnotation
          >(
            (resolve) => {
              resolveCreate =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .createHighlightAnnotation,
          'execute',
        )
          .mockReturnValue(
            pendingCreate,
          )

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              FIRST_BOOK_ID,
            ),
        })

        const createPromise =
          useAppStore
            .getState()
            .createHighlightAnnotation({
              pageNumber:
                3,

              pageOffsetRatio:
                0.4,

              color:
                AnnotationColor.YELLOW,

              selectedText:
                'Texto do primeiro livro',

              areas: [
                {
                  left: 0.1,
                  bottom: 0.2,
                  right: 0.6,
                  top: 0.4,
                },
              ],
            })

        const secondBookAnnotation =
          createNoteAnnotation({
            id:
              SECOND_ANNOTATION_ID,

            bookId:
              SECOND_BOOK_ID,

            content:
              'Nota atual',
          })

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              SECOND_BOOK_ID,
            ),

          annotations: [
            secondBookAnnotation,
          ],
        })

        resolveCreate(
          createHighlightAnnotation({
            id:
              FIRST_ANNOTATION_ID,

            bookId:
              FIRST_BOOK_ID,
          }),
        )

        await createPromise

        expect(
          useAppStore
            .getState()
            .annotations,
        ).toEqual([
          secondBookAnnotation,
        ])
      },
    )

    it(
      'ignora exclusão concluída depois que outro livro foi aberto',
      async () => {
        let resolveDelete:
          () => void =
          () => undefined

        const pendingDelete =
          new Promise<void>(
            (resolve) => {
              resolveDelete =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .deleteAnnotation,
          'execute',
        )
          .mockReturnValue(
            pendingDelete,
          )

        const firstBookAnnotation =
          createNoteAnnotation({
            id:
              FIRST_ANNOTATION_ID,

            bookId:
              FIRST_BOOK_ID,
          })

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              FIRST_BOOK_ID,
            ),

          annotations: [
            firstBookAnnotation,
          ],
        })

        const deletePromise =
          useAppStore
            .getState()
            .deleteAnnotation(
              FIRST_ANNOTATION_ID,
            )

        const secondBookAnnotation =
          createNoteAnnotation({
            id:
              SECOND_ANNOTATION_ID,

            bookId:
              SECOND_BOOK_ID,

            content:
              'Nota do livro atual',
          })

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              SECOND_BOOK_ID,
            ),

          annotations: [
            secondBookAnnotation,
          ],
        })

        resolveDelete()

        await deletePromise

        expect(
          useAppStore
            .getState()
            .annotations,
        ).toEqual([
          secondBookAnnotation,
        ])
      },
    )

    it(
      'ignora erro de criação de nota pertencente ao livro anterior',
      async () => {
        let rejectCreate:
          (
            reason:
              unknown,
          ) => void =
          () => undefined

        const pendingCreate =
          new Promise<
            NoteAnnotation
          >(
            (
              _resolve,
              reject,
            ) => {
              rejectCreate =
                reject
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .createNoteAnnotation,
          'execute',
        )
          .mockReturnValue(
            pendingCreate,
          )

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              FIRST_BOOK_ID,
            ),
        })

        const createPromise =
          useAppStore
            .getState()
            .createNoteAnnotation({
              pageNumber:
                2,

              pageOffsetRatio:
                0.3,

              content:
                'Nota antiga',
            })

        const secondBookAnnotation =
          createNoteAnnotation({
            id:
              SECOND_ANNOTATION_ID,

            bookId:
              SECOND_BOOK_ID,

            content:
              'Nota do livro atual',
          })

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              SECOND_BOOK_ID,
            ),

          annotations: [
            secondBookAnnotation,
          ],

          annotationErrorMessage:
            null,

          annotationMutationStatus:
            AsyncStatus.IDLE,
        })

        rejectCreate(
          new Error(
            'Erro pertencente ao livro anterior.',
          ),
        )

        await createPromise

        const state =
          useAppStore.getState()

        expect(
          state.annotations,
        ).toEqual([
          secondBookAnnotation,
        ])

        expect(
          state.annotationErrorMessage,
        ).toBeNull()

        expect(
          state.annotationMutationStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )
      },
    )

    it(
      'ignora erro de exclusão pertencente ao livro anterior',
      async () => {
        let rejectDelete:
          (
            reason:
              unknown,
          ) => void =
          () => undefined

        const pendingDelete =
          new Promise<void>(
            (
              _resolve,
              reject,
            ) => {
              rejectDelete =
                reject
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .deleteAnnotation,
          'execute',
        )
          .mockReturnValue(
            pendingDelete,
          )

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              FIRST_BOOK_ID,
            ),
        })

        const deletePromise =
          useAppStore
            .getState()
            .deleteAnnotation(
              FIRST_ANNOTATION_ID,
            )

        const secondBookAnnotation =
          createNoteAnnotation({
            id:
              SECOND_ANNOTATION_ID,

            bookId:
              SECOND_BOOK_ID,

            content:
              'Nota preservada',
          })

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              SECOND_BOOK_ID,
            ),

          annotations: [
            secondBookAnnotation,
          ],

          annotationErrorMessage:
            null,

          annotationMutationStatus:
            AsyncStatus.IDLE,
        })

        rejectDelete(
          new Error(
            'Erro pertencente ao livro anterior.',
          ),
        )

        await deletePromise

        const state =
          useAppStore.getState()

        expect(
          state.annotations,
        ).toEqual([
          secondBookAnnotation,
        ])

        expect(
          state.annotationErrorMessage,
        ).toBeNull()

        expect(
          state.annotationMutationStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )
      },
    )
  },
)
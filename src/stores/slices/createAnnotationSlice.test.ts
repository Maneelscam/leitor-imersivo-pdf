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
  NoteAnnotation,
} from '@/models/entities/Annotation'
import {
  AnnotationType,
} from '@/models/enums/AnnotationType'
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
  IsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import {
  useAppStore,
} from '@/stores/useAppStore'

const BOOK_ID =
  'livro-annotation-slice' as BookId

const SECOND_BOOK_ID =
  'livro-annotation-slice-2' as BookId

const FIRST_ANNOTATION_ID =
  'annotation-slice-1' as AnnotationId

const SECOND_ANNOTATION_ID =
  'annotation-slice-2' as AnnotationId

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
  bookId = BOOK_ID,
  pageNumber,
  pageOffsetRatio,
  content,
}: {
  readonly id: AnnotationId
  readonly bookId?: BookId
  readonly pageNumber: number
  readonly pageOffsetRatio: number
  readonly content: string
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
  'createAnnotationSlice',
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
      'informa erro ao carregar anotações sem livro aberto',
      async () => {
        const loadAnnotationsSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .loadAnnotations,
            'execute',
          )

        await useAppStore
          .getState()
          .loadAnnotations()

        const state =
          useAppStore.getState()

        expect(
          state.annotations,
        ).toEqual([])

        expect(
          state.annotationsLoadStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )

        expect(
          state.annotationErrorMessage,
        ).toBe(
          'Nenhum livro está aberto para carregar as anotações.',
        )

        expect(
          loadAnnotationsSpy,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'carrega as anotações do livro aberto',
      async () => {
        const firstAnnotation =
          createNoteAnnotation({
            id:
              FIRST_ANNOTATION_ID,

            pageNumber:
              2,

            pageOffsetRatio:
              0.3,

            content:
              'Primeira nota',
          })

        const secondAnnotation =
          createNoteAnnotation({
            id:
              SECOND_ANNOTATION_ID,

            pageNumber:
              4,

            pageOffsetRatio:
              0.7,

            content:
              'Segunda nota',
          })

        const loadAnnotationsSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .loadAnnotations,
            'execute',
          )
            .mockResolvedValue([
              firstAnnotation,
              secondAnnotation,
            ])

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              BOOK_ID,
            ),
        })

        await useAppStore
          .getState()
          .loadAnnotations()

        const state =
          useAppStore.getState()

        expect(
          loadAnnotationsSpy,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          loadAnnotationsSpy,
        ).toHaveBeenCalledWith(
          BOOK_ID,
        )

        expect(
          state.annotations,
        ).toEqual([
          firstAnnotation,
          secondAnnotation,
        ])

        expect(
          state.annotationsLoadStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )

        expect(
          state.annotationErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'registra erro quando o carregamento das anotações falha',
      async () => {
        vi.spyOn(
          applicationContainer
            .controllers
            .loadAnnotations,
          'execute',
        )
          .mockRejectedValue(
            new Error(
              'Falha controlada no carregamento.',
            ),
          )

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              BOOK_ID,
            ),

          annotations: [
            createNoteAnnotation({
              id:
                FIRST_ANNOTATION_ID,

              pageNumber:
                1,

              pageOffsetRatio:
                0.2,

              content:
                'Nota anterior',
            }),
          ],
        })

        await useAppStore
          .getState()
          .loadAnnotations()

        const state =
          useAppStore.getState()

        expect(
          state.annotations,
        ).toEqual([])

        expect(
          state.annotationsLoadStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )

        expect(
          state.annotationErrorMessage,
        ).toBe(
          'Falha controlada no carregamento.',
        )
      },
    )

    it(
      'informa erro ao criar nota sem livro aberto',
      async () => {
        const createNoteSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .createNoteAnnotation,
            'execute',
          )

        await useAppStore
          .getState()
          .createNoteAnnotation({
            pageNumber:
              3,

            pageOffsetRatio:
              0.4,

            content:
              'Nova nota',
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
          'Nenhum livro está aberto para criar a nota.',
        )

        expect(
          createNoteSpy,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'cria uma nota usando o livro atualmente aberto',
      async () => {
        const createdAnnotation =
          createNoteAnnotation({
            id:
              FIRST_ANNOTATION_ID,

            pageNumber:
              3,

            pageOffsetRatio:
              0.4,

            content:
              'Nova nota',
          })

        const createNoteSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .createNoteAnnotation,
            'execute',
          )
            .mockResolvedValue(
              createdAnnotation,
            )

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              BOOK_ID,
            ),
        })

        await useAppStore
          .getState()
          .createNoteAnnotation({
            pageNumber:
              3,

            pageOffsetRatio:
              0.4,

            content:
              'Nova nota',
          })

        const state =
          useAppStore.getState()

        expect(
          createNoteSpy,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          createNoteSpy,
        ).toHaveBeenCalledWith({
          pageNumber:
            3,

          pageOffsetRatio:
            0.4,

          content:
            'Nova nota',

          bookId:
            BOOK_ID,
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
      'mantém as anotações ordenadas após criar uma nova nota',
      async () => {
        const laterAnnotation =
          createNoteAnnotation({
            id:
              FIRST_ANNOTATION_ID,

            pageNumber:
              8,

            pageOffsetRatio:
              0.8,

            content:
              'Nota posterior',
          })

        const earlierAnnotation =
          createNoteAnnotation({
            id:
              SECOND_ANNOTATION_ID,

            pageNumber:
              2,

            pageOffsetRatio:
              0.2,

            content:
              'Nota anterior',
          })

        vi.spyOn(
          applicationContainer
            .controllers
            .createNoteAnnotation,
          'execute',
        )
          .mockResolvedValue(
            earlierAnnotation,
          )

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              BOOK_ID,
            ),

          annotations: [
            laterAnnotation,
          ],
        })

        await useAppStore
          .getState()
          .createNoteAnnotation({
            pageNumber:
              2,

            pageOffsetRatio:
              0.2,

            content:
              'Nota anterior',
          })

        expect(
          useAppStore
            .getState()
            .annotations,
        ).toEqual([
          earlierAnnotation,
          laterAnnotation,
        ])
      },
    )

    it(
      'substitui uma anotação com o mesmo identificador sem duplicá-la',
      async () => {
        const originalAnnotation =
          createNoteAnnotation({
            id:
              FIRST_ANNOTATION_ID,

            pageNumber:
              5,

            pageOffsetRatio:
              0.5,

            content:
              'Conteúdo antigo',
          })

        const updatedAnnotation =
          createNoteAnnotation({
            id:
              FIRST_ANNOTATION_ID,

            pageNumber:
              5,

            pageOffsetRatio:
              0.5,

            content:
              'Conteúdo atualizado',
          })

        vi.spyOn(
          applicationContainer
            .controllers
            .createNoteAnnotation,
          'execute',
        )
          .mockResolvedValue(
            updatedAnnotation,
          )

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              BOOK_ID,
            ),

          annotations: [
            originalAnnotation,
          ],
        })

        await useAppStore
          .getState()
          .createNoteAnnotation({
            pageNumber:
              5,

            pageOffsetRatio:
              0.5,

            content:
              'Conteúdo atualizado',
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
      'remove uma anotação após exclusão bem-sucedida',
      async () => {
        const deletedAnnotation =
          createNoteAnnotation({
            id:
              FIRST_ANNOTATION_ID,

            pageNumber:
              2,

            pageOffsetRatio:
              0.3,

            content:
              'Será excluída',
          })

        const preservedAnnotation =
          createNoteAnnotation({
            id:
              SECOND_ANNOTATION_ID,

            pageNumber:
              6,

            pageOffsetRatio:
              0.5,

            content:
              'Será preservada',
          })

        const deleteAnnotationSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .deleteAnnotation,
            'execute',
          )
            .mockResolvedValue(
              undefined,
            )

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              BOOK_ID,
            ),

          annotations: [
            deletedAnnotation,
            preservedAnnotation,
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
          deleteAnnotationSpy,
        ).toHaveBeenCalledWith(
          FIRST_ANNOTATION_ID,
        )

        expect(
          state.annotations,
        ).toEqual([
          preservedAnnotation,
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
      'preserva o estado do livro atual quando o livro muda durante um carregamento',
      async () => {
        let resolveLoad:
          (
            annotations:
              readonly NoteAnnotation[],
          ) => void =
          () => undefined

        const pendingLoad =
          new Promise<
            readonly NoteAnnotation[]
          >(
            (resolve) => {
              resolveLoad =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .loadAnnotations,
          'execute',
        )
          .mockReturnValue(
            pendingLoad,
          )

        useAppStore.setState({
          openedBook:
            createOpenedBook(
              BOOK_ID,
            ),
        })

        const loadPromise =
          useAppStore
            .getState()
            .loadAnnotations()

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

        resolveLoad([
          createNoteAnnotation({
            id:
              FIRST_ANNOTATION_ID,

            bookId:
              BOOK_ID,

            pageNumber:
              1,

            pageOffsetRatio:
              0.2,

            content:
              'Resultado antigo',
          }),
        ])

        await loadPromise

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
      'limpa a mensagem de erro das anotações',
      () => {
        useAppStore.setState({
          annotationErrorMessage:
            'Erro de teste',
        })

        useAppStore
          .getState()
          .clearAnnotationError()

        expect(
          useAppStore
            .getState()
            .annotationErrorMessage,
        ).toBeNull()
      },
    )
  },
)
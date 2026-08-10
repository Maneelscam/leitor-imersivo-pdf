import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  LoadAnnotationsController,
} from '@/controllers/annotations/LoadAnnotationsController'
import type {
  NoteAnnotation,
} from '@/models/entities/Annotation'
import {
  AnnotationType,
} from '@/models/enums/AnnotationType'
import type {
  AnnotationId,
} from '@/models/value-objects/AnnotationId'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  IsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import type {
  AnnotationRepository,
} from '@/repositories/contracts/AnnotationRepository'

const BOOK_ID =
  'livro-load-teste' as BookId

function createNoteAnnotation({
  id,
  pageNumber,
  pageOffsetRatio,
  createdAt,
}: {
  readonly id: string
  readonly pageNumber: number
  readonly pageOffsetRatio: number
  readonly createdAt: string
}): NoteAnnotation {
  return {
    id:
      id as AnnotationId,

    bookId:
      BOOK_ID,

    pageNumber,
    pageOffsetRatio,

    type:
      AnnotationType.NOTE,

    content:
      `Nota ${id}`,

    createdAt:
      createdAt as IsoDateTime,

    updatedAt:
      createdAt as IsoDateTime,
  }
}

function createAnnotationRepository(
  annotations:
    readonly NoteAnnotation[],
): AnnotationRepository {
  return {
    save:
      vi.fn(
        async () => undefined,
      ),

    findById:
      vi.fn(
        async () => null,
      ),

    findByBookId:
      vi.fn(
        async () => annotations,
      ),

    findByBookAndPage:
      vi.fn(
        async () => [],
      ),

    deleteById:
      vi.fn(
        async () => undefined,
      ),

    deleteByBookId:
      vi.fn(
        async () => undefined,
      ),
  }
}

describe(
  'LoadAnnotationsController',
  () => {
    it(
      'carrega as anotações do livro solicitado',
      async () => {
        const annotation =
          createNoteAnnotation({
            id:
              'anotacao-1',

            pageNumber:
              1,

            pageOffsetRatio:
              0.2,

            createdAt:
              '2026-08-07T10:00:00.000Z',
          })

        const annotationRepository =
          createAnnotationRepository([
            annotation,
          ])

        const controller =
          new LoadAnnotationsController(
            annotationRepository,
          )

        const annotations =
          await controller.execute(
            BOOK_ID,
          )

        expect(
          annotationRepository.findByBookId,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          annotationRepository.findByBookId,
        ).toHaveBeenCalledWith(
          BOOK_ID,
        )

        expect(
          annotations,
        ).toEqual([
          annotation,
        ])
      },
    )

    it(
      'ordena as anotações pelo número da página',
      async () => {
        const pageThree =
          createNoteAnnotation({
            id:
              'pagina-3',

            pageNumber:
              3,

            pageOffsetRatio:
              0.1,

            createdAt:
              '2026-08-07T10:00:00.000Z',
          })

        const pageOne =
          createNoteAnnotation({
            id:
              'pagina-1',

            pageNumber:
              1,

            pageOffsetRatio:
              0.8,

            createdAt:
              '2026-08-07T10:00:00.000Z',
          })

        const pageTwo =
          createNoteAnnotation({
            id:
              'pagina-2',

            pageNumber:
              2,

            pageOffsetRatio:
              0.5,

            createdAt:
              '2026-08-07T10:00:00.000Z',
          })

        const annotationRepository =
          createAnnotationRepository([
            pageThree,
            pageOne,
            pageTwo,
          ])

        const controller =
          new LoadAnnotationsController(
            annotationRepository,
          )

        const annotations =
          await controller.execute(
            BOOK_ID,
          )

        expect(
          annotations.map(
            (annotation) =>
              annotation.id,
          ),
        ).toEqual([
          pageOne.id,
          pageTwo.id,
          pageThree.id,
        ])
      },
    )

    it(
      'ordena anotações da mesma página pelo deslocamento',
      async () => {
        const lowerAnnotation =
          createNoteAnnotation({
            id:
              'offset-menor',

            pageNumber:
              5,

            pageOffsetRatio:
              0.2,

            createdAt:
              '2026-08-07T10:00:00.000Z',
          })

        const middleAnnotation =
          createNoteAnnotation({
            id:
              'offset-meio',

            pageNumber:
              5,

            pageOffsetRatio:
              0.5,

            createdAt:
              '2026-08-07T10:00:00.000Z',
          })

        const upperAnnotation =
          createNoteAnnotation({
            id:
              'offset-maior',

            pageNumber:
              5,

            pageOffsetRatio:
              0.9,

            createdAt:
              '2026-08-07T10:00:00.000Z',
          })

        const annotationRepository =
          createAnnotationRepository([
            upperAnnotation,
            middleAnnotation,
            lowerAnnotation,
          ])

        const controller =
          new LoadAnnotationsController(
            annotationRepository,
          )

        const annotations =
          await controller.execute(
            BOOK_ID,
          )

        expect(
          annotations.map(
            (annotation) =>
              annotation.id,
          ),
        ).toEqual([
          lowerAnnotation.id,
          middleAnnotation.id,
          upperAnnotation.id,
        ])
      },
    )

    it(
      'usa a data de criação como desempate de posição',
      async () => {
        const newerAnnotation =
          createNoteAnnotation({
            id:
              'mais-nova',

            pageNumber:
              4,

            pageOffsetRatio:
              0.5,

            createdAt:
              '2026-08-07T12:00:00.000Z',
          })

        const olderAnnotation =
          createNoteAnnotation({
            id:
              'mais-antiga',

            pageNumber:
              4,

            pageOffsetRatio:
              0.5,

            createdAt:
              '2026-08-07T09:00:00.000Z',
          })

        const annotationRepository =
          createAnnotationRepository([
            newerAnnotation,
            olderAnnotation,
          ])

        const controller =
          new LoadAnnotationsController(
            annotationRepository,
          )

        const annotations =
          await controller.execute(
            BOOK_ID,
          )

        expect(
          annotations.map(
            (annotation) =>
              annotation.id,
          ),
        ).toEqual([
          olderAnnotation.id,
          newerAnnotation.id,
        ])
      },
    )

    it(
      'não altera a ordem do array retornado pelo repositório',
      async () => {
        const second =
          createNoteAnnotation({
            id:
              'segunda',

            pageNumber:
              2,

            pageOffsetRatio:
              0.5,

            createdAt:
              '2026-08-07T10:00:00.000Z',
          })

        const first =
          createNoteAnnotation({
            id:
              'primeira',

            pageNumber:
              1,

            pageOffsetRatio:
              0.5,

            createdAt:
              '2026-08-07T10:00:00.000Z',
          })

        const repositoryAnnotations = [
          second,
          first,
        ]

        const annotationRepository =
          createAnnotationRepository(
            repositoryAnnotations,
          )

        const controller =
          new LoadAnnotationsController(
            annotationRepository,
          )

        const annotations =
          await controller.execute(
            BOOK_ID,
          )

        expect(
          repositoryAnnotations,
        ).toEqual([
          second,
          first,
        ])

        expect(
          annotations,
        ).toEqual([
          first,
          second,
        ])

        expect(
          annotations,
        ).not.toBe(
          repositoryAnnotations,
        )
      },
    )

    it(
      'retorna lista vazia quando o livro não possui anotações',
      async () => {
        const annotationRepository =
          createAnnotationRepository(
            [],
          )

        const controller =
          new LoadAnnotationsController(
            annotationRepository,
          )

        const annotations =
          await controller.execute(
            BOOK_ID,
          )

        expect(
          annotations,
        ).toEqual([])
      },
    )
  },
)
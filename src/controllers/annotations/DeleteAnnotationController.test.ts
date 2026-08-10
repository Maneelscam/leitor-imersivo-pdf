import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  DeleteAnnotationController,
} from '@/controllers/annotations/DeleteAnnotationController'
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

const ANNOTATION_ID =
  'anotacao-delete-teste' as AnnotationId

const BOOK_ID =
  'livro-delete-teste' as BookId

const TEST_DATE =
  '2026-08-07T11:00:00.000Z' as IsoDateTime

function createAnnotation():
  NoteAnnotation {
  return {
    id:
      ANNOTATION_ID,

    bookId:
      BOOK_ID,

    pageNumber:
      3,

    pageOffsetRatio:
      0.4,

    type:
      AnnotationType.NOTE,

    content:
      'Anotação de teste',

    createdAt:
      TEST_DATE,

    updatedAt:
      TEST_DATE,
  }
}

function createAnnotationRepository(
  annotation:
    NoteAnnotation | null,
): AnnotationRepository {
  return {
    save:
      vi.fn(
        async () => undefined,
      ),

    findById:
      vi.fn(
        async () => annotation,
      ),

    findByBookId:
      vi.fn(
        async () => [],
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
  'DeleteAnnotationController',
  () => {
    it(
      'exclui uma anotação existente',
      async () => {
        const annotation =
          createAnnotation()

        const annotationRepository =
          createAnnotationRepository(
            annotation,
          )

        const controller =
          new DeleteAnnotationController(
            annotationRepository,
          )

        await controller.execute(
          ANNOTATION_ID,
        )

        expect(
          annotationRepository.findById,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          annotationRepository.findById,
        ).toHaveBeenCalledWith(
          ANNOTATION_ID,
        )

        expect(
          annotationRepository.deleteById,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          annotationRepository.deleteById,
        ).toHaveBeenCalledWith(
          ANNOTATION_ID,
        )
      },
    )

    it(
      'não tenta excluir quando a anotação não existe',
      async () => {
        const annotationRepository =
          createAnnotationRepository(
            null,
          )

        const controller =
          new DeleteAnnotationController(
            annotationRepository,
          )

        await controller.execute(
          ANNOTATION_ID,
        )

        expect(
          annotationRepository.findById,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          annotationRepository.deleteById,
        ).not.toHaveBeenCalled()
      },
    )
  },
)
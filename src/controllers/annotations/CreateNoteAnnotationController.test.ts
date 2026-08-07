import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  CreateNoteAnnotationController,
} from '@/controllers/annotations/CreateNoteAnnotationController'
import type {
  AnnotationRepository,
} from '@/repositories/contracts/AnnotationRepository'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import {
  AnnotationType,
} from '@/models/enums/AnnotationType'

const BOOK_ID =
  'livro-teste-nota' as BookId

function createAnnotationRepository():
  AnnotationRepository {
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
  'CreateNoteAnnotationController',
  () => {
    it(
      'cria e persiste uma nota válida',
      async () => {
        const annotationRepository =
          createAnnotationRepository()

        const controller =
          new CreateNoteAnnotationController(
            annotationRepository,
          )

        const annotation =
          await controller.execute({
            bookId:
              BOOK_ID,

            pageNumber:
              5,

            pageOffsetRatio:
              0.4,

            content:
              'Minha anotação',
          })

        expect(
          annotation.bookId,
        ).toBe(
          BOOK_ID,
        )

        expect(
          annotation.pageNumber,
        ).toBe(
          5,
        )

        expect(
          annotation.pageOffsetRatio,
        ).toBe(
          0.4,
        )

        expect(
          annotation.type,
        ).toBe(
          AnnotationType.NOTE,
        )

        expect(
          annotation.content,
        ).toBe(
          'Minha anotação',
        )

        expect(
          annotation.id,
        ).toEqual(
          expect.any(String),
        )

        expect(
          annotation.createdAt,
        ).toEqual(
          expect.any(String),
        )

        expect(
          annotation.updatedAt,
        ).toBe(
          annotation.createdAt,
        )

        expect(
          annotationRepository.save,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          annotationRepository.save,
        ).toHaveBeenCalledWith(
          annotation,
        )
      },
    )

    it(
      'remove espaços extras do conteúdo',
      async () => {
        const annotationRepository =
          createAnnotationRepository()

        const controller =
          new CreateNoteAnnotationController(
            annotationRepository,
          )

        const annotation =
          await controller.execute({
            bookId:
              BOOK_ID,

            pageNumber:
              2,

            pageOffsetRatio:
              0.5,

            content:
              '   Conteúdo da nota   ',
          })

        expect(
          annotation.content,
        ).toBe(
          'Conteúdo da nota',
        )
      },
    )

    it(
      'limita o deslocamento inferior a zero',
      async () => {
        const annotationRepository =
          createAnnotationRepository()

        const controller =
          new CreateNoteAnnotationController(
            annotationRepository,
          )

        const annotation =
          await controller.execute({
            bookId:
              BOOK_ID,

            pageNumber:
              1,

            pageOffsetRatio:
              -10,

            content:
              'Nota válida',
          })

        expect(
          annotation.pageOffsetRatio,
        ).toBe(
          0,
        )
      },
    )

    it(
      'limita o deslocamento superior a um',
      async () => {
        const annotationRepository =
          createAnnotationRepository()

        const controller =
          new CreateNoteAnnotationController(
            annotationRepository,
          )

        const annotation =
          await controller.execute({
            bookId:
              BOOK_ID,

            pageNumber:
              1,

            pageOffsetRatio:
              8,

            content:
              'Nota válida',
          })

        expect(
          annotation.pageOffsetRatio,
        ).toBe(
          1,
        )
      },
    )

    it(
      'normaliza deslocamento não finito para zero',
      async () => {
        const annotationRepository =
          createAnnotationRepository()

        const controller =
          new CreateNoteAnnotationController(
            annotationRepository,
          )

        const annotation =
          await controller.execute({
            bookId:
              BOOK_ID,

            pageNumber:
              1,

            pageOffsetRatio:
              Number.NaN,

            content:
              'Nota válida',
          })

        expect(
          annotation.pageOffsetRatio,
        ).toBe(
          0,
        )
      },
    )

    it.each([
      0,
      -1,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ])(
      'rejeita número de página inválido: %s',
      async (
        pageNumber,
      ) => {
        const annotationRepository =
          createAnnotationRepository()

        const controller =
          new CreateNoteAnnotationController(
            annotationRepository,
          )

        await expect(
          controller.execute({
            bookId:
              BOOK_ID,

            pageNumber,

            pageOffsetRatio:
              0.5,

            content:
              'Nota válida',
          }),
        ).rejects.toBeInstanceOf(
          Error,
        )

        expect(
          annotationRepository.save,
        ).not.toHaveBeenCalled()
      },
    )

    it.each([
      '',
      ' ',
      '     ',
      '\n\t',
    ])(
      'rejeita conteúdo vazio',
      async (
        content,
      ) => {
        const annotationRepository =
          createAnnotationRepository()

        const controller =
          new CreateNoteAnnotationController(
            annotationRepository,
          )

        await expect(
          controller.execute({
            bookId:
              BOOK_ID,

            pageNumber:
              1,

            pageOffsetRatio:
              0.5,

            content,
          }),
        ).rejects.toBeInstanceOf(
          Error,
        )

        expect(
          annotationRepository.save,
        ).not.toHaveBeenCalled()
      },
    )
  },
)
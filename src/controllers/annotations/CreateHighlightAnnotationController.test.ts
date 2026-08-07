import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  CreateHighlightAnnotationController,
} from '@/controllers/annotations/CreateHighlightAnnotationController'
import {
  AnnotationColor,
} from '@/models/enums/AnnotationColor'
import {
  AnnotationType,
} from '@/models/enums/AnnotationType'
import type {
  AnnotationArea,
} from '@/models/value-objects/AnnotationArea'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  AnnotationRepository,
} from '@/repositories/contracts/AnnotationRepository'

const BOOK_ID =
  'livro-teste-marcacao' as BookId

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

function createValidArea():
  AnnotationArea {
  return {
    left: 0.1,
    bottom: 0.2,
    right: 0.6,
    top: 0.4,
  }
}

describe(
  'CreateHighlightAnnotationController',
  () => {
    it(
      'cria e persiste uma marcação válida',
      async () => {
        const annotationRepository =
          createAnnotationRepository()

        const controller =
          new CreateHighlightAnnotationController(
            annotationRepository,
          )

        const areas = [
          createValidArea(),
        ]

        const annotation =
          await controller.execute({
            bookId:
              BOOK_ID,

            pageNumber:
              5,

            pageOffsetRatio:
              0.4,

            color:
              AnnotationColor.YELLOW,

            selectedText:
              'Texto selecionado',

            areas,
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
          AnnotationType.HIGHLIGHT,
        )

        expect(
          annotation.color,
        ).toBe(
          AnnotationColor.YELLOW,
        )

        expect(
          annotation.selectedText,
        ).toBe(
          'Texto selecionado',
        )

        expect(
          annotation.areas,
        ).toEqual(
          areas,
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
      'normaliza espaços do texto selecionado',
      async () => {
        const annotationRepository =
          createAnnotationRepository()

        const controller =
          new CreateHighlightAnnotationController(
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

            color:
              AnnotationColor.GREEN,

            selectedText:
              '   Um   texto\ncom\tvários   espaços   ',

            areas: [
              createValidArea(),
            ],
          })

        expect(
          annotation.selectedText,
        ).toBe(
          'Um texto com vários espaços',
        )
      },
    )

    it(
      'copia as áreas recebidas para a nova anotação',
      async () => {
        const annotationRepository =
          createAnnotationRepository()

        const controller =
          new CreateHighlightAnnotationController(
            annotationRepository,
          )

        const area =
          createValidArea()

        const areas = [
          area,
        ]

        const annotation =
          await controller.execute({
            bookId:
              BOOK_ID,

            pageNumber:
              3,

            pageOffsetRatio:
              0.5,

            color:
              AnnotationColor.BLUE,

            selectedText:
              'Texto válido',

            areas,
          })

        expect(
          annotation.areas,
        ).toEqual(
          areas,
        )

        expect(
          annotation.areas,
        ).not.toBe(
          areas,
        )

        expect(
          annotation.areas[0],
        ).not.toBe(
          area,
        )
      },
    )

    it(
      'limita o deslocamento inferior a zero',
      async () => {
        const annotationRepository =
          createAnnotationRepository()

        const controller =
          new CreateHighlightAnnotationController(
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

            color:
              AnnotationColor.PINK,

            selectedText:
              'Texto válido',

            areas: [
              createValidArea(),
            ],
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
          new CreateHighlightAnnotationController(
            annotationRepository,
          )

        const annotation =
          await controller.execute({
            bookId:
              BOOK_ID,

            pageNumber:
              1,

            pageOffsetRatio:
              10,

            color:
              AnnotationColor.PINK,

            selectedText:
              'Texto válido',

            areas: [
              createValidArea(),
            ],
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
          new CreateHighlightAnnotationController(
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

            color:
              AnnotationColor.YELLOW,

            selectedText:
              'Texto válido',

            areas: [
              createValidArea(),
            ],
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
          new CreateHighlightAnnotationController(
            annotationRepository,
          )

        await expect(
          controller.execute({
            bookId:
              BOOK_ID,

            pageNumber,

            pageOffsetRatio:
              0.5,

            color:
              AnnotationColor.YELLOW,

            selectedText:
              'Texto válido',

            areas: [
              createValidArea(),
            ],
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
      'rejeita texto selecionado vazio',
      async (
        selectedText,
      ) => {
        const annotationRepository =
          createAnnotationRepository()

        const controller =
          new CreateHighlightAnnotationController(
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

            color:
              AnnotationColor.YELLOW,

            selectedText,

            areas: [
              createValidArea(),
            ],
          }),
        ).rejects.toBeInstanceOf(
          Error,
        )

        expect(
          annotationRepository.save,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'rejeita cor inválida',
      async () => {
        const annotationRepository =
          createAnnotationRepository()

        const controller =
          new CreateHighlightAnnotationController(
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

            color:
              'orange' as typeof AnnotationColor.YELLOW,

            selectedText:
              'Texto válido',

            areas: [
              createValidArea(),
            ],
          }),
        ).rejects.toBeInstanceOf(
          Error,
        )

        expect(
          annotationRepository.save,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'rejeita lista vazia de áreas',
      async () => {
        const annotationRepository =
          createAnnotationRepository()

        const controller =
          new CreateHighlightAnnotationController(
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

            color:
              AnnotationColor.YELLOW,

            selectedText:
              'Texto válido',

            areas: [],
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
      {
        left: 0.5,
        bottom: 0.2,
        right: 0.5,
        top: 0.4,
      },
      {
        left: 0.7,
        bottom: 0.2,
        right: 0.5,
        top: 0.4,
      },
      {
        left: 0.1,
        bottom: 0.4,
        right: 0.6,
        top: 0.4,
      },
      {
        left: 0.1,
        bottom: 0.7,
        right: 0.6,
        top: 0.4,
      },
      {
        left: Number.NaN,
        bottom: 0.2,
        right: 0.6,
        top: 0.4,
      },
      {
        left: 0.1,
        bottom: 0.2,
        right:
          Number.POSITIVE_INFINITY,
        top: 0.4,
      },
    ])(
      'rejeita área geométrica inválida',
      async (
        invalidArea,
      ) => {
        const annotationRepository =
          createAnnotationRepository()

        const controller =
          new CreateHighlightAnnotationController(
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

            color:
              AnnotationColor.YELLOW,

            selectedText:
              'Texto válido',

            areas: [
              invalidArea as AnnotationArea,
            ],
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
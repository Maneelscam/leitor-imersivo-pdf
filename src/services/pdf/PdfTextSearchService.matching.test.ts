import type {
  PDFDocumentProxy,
  PDFPageProxy,
} from 'pdfjs-dist'
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  PdfTextSearchService,
} from '@/services/pdf/PdfTextSearchService'

interface TextItemOptions {
  readonly text: string
  readonly x?: number
  readonly y?: number
  readonly width?: number
  readonly height?: number
  readonly fontName?: string
  readonly hasEOL?: boolean
}

interface TestPdfPageOptions {
  readonly pageNumber?: number
  readonly viewportHeight?: number
  readonly items?: readonly unknown[]
  readonly styles?: unknown
}

function createTextItem({
  text,
  x = 100,
  y = 500,
  width = 80,
  height = 20,
  fontName = 'F1',
  hasEOL = false,
}: TextItemOptions): unknown {
  return {
    str: text,

    transform: [
      1,
      0,
      0,
      1,
      x,
      y,
    ],

    width,
    height,
    fontName,
    hasEOL,
  }
}

function createPdfPage({
  pageNumber = 1,
  viewportHeight = 1000,
  items = [],
  styles = {
    F1: {
      fontFamily:
        'Arial',

      ascent:
        0.8,

      descent:
        -0.2,
    },
  },
}: TestPdfPageOptions = {}): PDFPageProxy {
  return {
    pageNumber,

    getTextContent:
      vi.fn()
        .mockResolvedValue({
          items,
          styles,
        }),

    getViewport:
      vi.fn()
        .mockReturnValue({
          height:
            viewportHeight,
        }),
  } as unknown as PDFPageProxy
}

function createPdfDocument(
  pages:
    readonly PDFPageProxy[],
): PDFDocumentProxy {
  return {
    numPages:
      pages.length,

    getPage:
      vi.fn(
        async (
          pageNumber: number,
        ) => {
          const page =
            pages[
              pageNumber - 1
            ]

          if (page === undefined) {
            throw new Error(
              `Página ${pageNumber} inexistente.`,
            )
          }

          return page
        },
      ),
  } as unknown as PDFDocumentProxy
}

describe(
  'PdfTextSearchService matching',
  () => {
    it(
      'pesquisa sem diferenciar maiúsculas, minúsculas ou acentos',
      async () => {
        const page =
          createPdfPage({
            items: [
              createTextItem({
                text:
                  'CONEXÃO',

                x:
                  100,

                y:
                  600,

                width:
                  80,

                height:
                  20,
              }),
            ],
          })

        const document =
          createPdfDocument([
            page,
          ])

        const service =
          new PdfTextSearchService()

        const result =
          await service.search(
            document,
            'conexao',
          )

        expect(
          result.totalOccurrences,
        ).toBe(
          1,
        )

        expect(
          result.pagesWithOccurrences,
        ).toBe(
          1,
        )

        expect(
          result.pageResults,
        ).toHaveLength(
          1,
        )

        const occurrence =
          result
            .pageResults[0]
            ?.occurrences[0]

        expect(
          occurrence,
        ).toBeDefined()

        expect(
          occurrence?.matchedText,
        ).toBe(
          'CONEXÃO',
        )

        expect(
          occurrence?.pageNumber,
        ).toBe(
          1,
        )

        expect(
          occurrence
            ?.occurrenceIndexOnPage,
        ).toBe(
          1,
        )

        expect(
          occurrence
            ?.pageOffsetRatio,
        ).toBeCloseTo(
          0.4,
        )

        expect(
          occurrence?.highlightAreas,
        ).toEqual([
          {
            left:
              100,

            bottom:
              596,

            right:
              180,

            top:
              616,
          },
        ])
      },
    )

    it(
      'encontra termo dividido entre dois itens na mesma linha',
      async () => {
        const page =
          createPdfPage({
            items: [
              createTextItem({
                text:
                  'internet',

                x:
                  100,

                y:
                  500,

                width:
                  60,
              }),

              createTextItem({
                text:
                  'fibra',

                x:
                  170,

                y:
                  500,

                width:
                  40,
              }),
            ],
          })

        const document =
          createPdfDocument([
            page,
          ])

        const service =
          new PdfTextSearchService()

        const result =
          await service.search(
            document,
            'internet fibra',
          )

        expect(
          result.totalOccurrences,
        ).toBe(
          1,
        )

        const occurrence =
          result
            .pageResults[0]
            ?.occurrences[0]

        expect(
          occurrence?.matchedText,
        ).toBe(
          'internet fibra',
        )

        expect(
          occurrence?.highlightAreas,
        ).toHaveLength(
          2,
        )

        expect(
          occurrence
            ?.highlightAreas[0],
        ).toEqual({
          left:
            100,

          bottom:
            496,

          right:
            160,

          top:
            516,
        })

        expect(
          occurrence
            ?.highlightAreas[1],
        ).toEqual({
          left:
            170,

          bottom:
            496,

          right:
            210,

          top:
            516,
        })
      },
    )

    it(
      'trata quebra de linha entre itens como espaço pesquisável',
      async () => {
        const page =
          createPdfPage({
            items: [
              createTextItem({
                text:
                  'internet',

                x:
                  100,

                y:
                  700,

                width:
                  60,

                hasEOL:
                  true,
              }),

              createTextItem({
                text:
                  'fibra',

                x:
                  100,

                y:
                  670,

                width:
                  40,
              }),
            ],
          })

        const document =
          createPdfDocument([
            page,
          ])

        const service =
          new PdfTextSearchService()

        const result =
          await service.search(
            document,
            'internet fibra',
          )

        expect(
          result.totalOccurrences,
        ).toBe(
          1,
        )

        expect(
          result
            .pageResults[0]
            ?.occurrences[0]
            ?.matchedText,
        ).toBe(
          'internet fibra',
        )

        expect(
          result
            .pageResults[0]
            ?.occurrences[0]
            ?.highlightAreas,
        ).toHaveLength(
          2,
        )
      },
    )

    it(
      'normaliza espaços e acentos também na consulta',
      async () => {
        const page =
          createPdfPage({
            items: [
              createTextItem({
                text:
                  'Internet',

                x:
                  100,

                width:
                  60,
              }),

              createTextItem({
                text:
                  'Fibra',

                x:
                  170,

                width:
                  40,
              }),
            ],
          })

        const document =
          createPdfDocument([
            page,
          ])

        const service =
          new PdfTextSearchService()

        const result =
          await service.search(
            document,
            '  INTERNET   FÍBRA  ',
          )

        expect(
          result.query,
        ).toBe(
          'INTERNET   FÍBRA',
        )

        expect(
          result.totalOccurrences,
        ).toBe(
          1,
        )

        expect(
          result
            .pageResults[0]
            ?.occurrences[0]
            ?.matchedText,
        ).toBe(
          'Internet Fibra',
        )
      },
    )

    it(
      'encontra múltiplas ocorrências sem sobreposição',
      async () => {
        const page =
          createPdfPage({
            items: [
              createTextItem({
                text:
                  'internet internet internet',

                width:
                  240,
              }),
            ],
          })

        const document =
          createPdfDocument([
            page,
          ])

        const service =
          new PdfTextSearchService()

        const result =
          await service.search(
            document,
            'internet',
          )

        expect(
          result.totalOccurrences,
        ).toBe(
          3,
        )

        expect(
          result.pagesWithOccurrences,
        ).toBe(
          1,
        )

        const occurrences =
          result
            .pageResults[0]
            ?.occurrences

        expect(
          occurrences,
        ).toHaveLength(
          3,
        )

        expect(
          occurrences?.map(
            (
              occurrence,
            ) =>
              occurrence
                .occurrenceIndexOnPage,
          ),
        ).toEqual([
          1,
          2,
          3,
        ])

        expect(
          occurrences?.map(
            (
              occurrence,
            ) =>
              occurrence
                .matchedText,
          ),
        ).toEqual([
          'internet',
          'internet',
          'internet',
        ])
      },
    )

    it(
      'contabiliza ocorrências e páginas encontradas separadamente',
      async () => {
        const firstPage =
          createPdfPage({
            pageNumber:
              1,

            items: [
              createTextItem({
                text:
                  'internet internet',
              }),
            ],
          })

        const secondPage =
          createPdfPage({
            pageNumber:
              2,

            items: [
              createTextItem({
                text:
                  'nenhum resultado aqui',
              }),
            ],
          })

        const thirdPage =
          createPdfPage({
            pageNumber:
              3,

            items: [
              createTextItem({
                text:
                  'internet',
              }),
            ],
          })

        const document =
          createPdfDocument([
            firstPage,
            secondPage,
            thirdPage,
          ])

        const service =
          new PdfTextSearchService()

        const result =
          await service.search(
            document,
            'internet',
          )

        expect(
          result.totalPagesSearched,
        ).toBe(
          3,
        )

        expect(
          result.totalOccurrences,
        ).toBe(
          3,
        )

        expect(
          result.pagesWithOccurrences,
        ).toBe(
          2,
        )

        expect(
          result.pageResults.map(
            (
              pageResult,
            ) =>
              pageResult
                .pageNumber,
          ),
        ).toEqual([
          1,
          3,
        ])

        expect(
          result.pageResults.map(
            (
              pageResult,
            ) =>
              pageResult
                .occurrenceCount,
          ),
        ).toEqual([
          2,
          1,
        ])
      },
    )

    it(
      'cria preview com contexto e reticências quando a ocorrência está no meio do texto',
      async () => {
        const prefix =
          'A'.repeat(
            80,
          )

        const suffix =
          'B'.repeat(
            80,
          )

        const page =
          createPdfPage({
            items: [
              createTextItem({
                text:
                  `${prefix} internet ${suffix}`,

                width:
                  600,
              }),
            ],
          })

        const document =
          createPdfDocument([
            page,
          ])

        const service =
          new PdfTextSearchService()

        const result =
          await service.search(
            document,
            'internet',
          )

        const preview =
          result
            .pageResults[0]
            ?.occurrences[0]
            ?.preview

        expect(
          preview,
        ).toBeDefined()

        expect(
          preview,
        ).toContain(
          'internet',
        )

        expect(
          preview?.startsWith(
            '\u2026',
          ),
        ).toBe(
          true,
        )

        expect(
          preview?.endsWith(
            '\u2026',
          ),
        ).toBe(
          true,
        )

        expect(
          preview,
        ).not.toBe(
          `${prefix} internet ${suffix}`,
        )
      },
    )

    it(
      'ignora itens inválidos retornados pelo PDF.js',
      async () => {
        const page =
          createPdfPage({
            items: [
              {
                str:
                  'não deve entrar',

                transform:
                  [1, 0],

                width:
                  20,

                height:
                  20,

                fontName:
                  'F1',

                hasEOL:
                  false,
              },

              createTextItem({
                text:
                  'internet',
              }),
            ],
          })

        const document =
          createPdfDocument([
            page,
          ])

        const service =
          new PdfTextSearchService()

        const internetResult =
          await service.search(
            document,
            'internet',
          )

        expect(
          internetResult
            .totalOccurrences,
        ).toBe(
          1,
        )

        const invalidResult =
          await service.search(
            document,
            'não deve entrar',
          )

        expect(
          invalidResult
            .totalOccurrences,
        ).toBe(
          0,
        )

        expect(
          invalidResult
            .pageResults,
        ).toEqual(
          [],
        )
      },
    )
  },
)
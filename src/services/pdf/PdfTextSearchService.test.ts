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
  PdfTextSearchError,
  PdfTextSearchErrorCode,
} from '@/errors/reader/PdfTextSearchError'
import {
  PdfTextSearchService,
} from '@/services/pdf/PdfTextSearchService'

interface TestPdfPage {
  readonly page:
    PDFPageProxy

  readonly getTextContent:
    ReturnType<typeof vi.fn>

  readonly getViewport:
    ReturnType<typeof vi.fn>
}

interface TestPdfDocument {
  readonly document:
    PDFDocumentProxy

  readonly getPage:
    ReturnType<typeof vi.fn>
}

function createPdfPage(
  pageNumber: number,
): TestPdfPage {
  const getTextContent =
    vi.fn()
      .mockResolvedValue({
        items: [],
        styles: {},
      })

  const getViewport =
    vi.fn()
      .mockReturnValue({
        height: 1000,
      })

  const page = {
    pageNumber,
    getTextContent,
    getViewport,
  } as unknown as PDFPageProxy

  return {
    page,
    getTextContent,
    getViewport,
  }
}

function createPdfDocument(
  pages:
    readonly PDFPageProxy[],
  numPages = pages.length,
): TestPdfDocument {
  const getPage =
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
    )

  const document = {
    numPages,
    getPage,
  } as unknown as PDFDocumentProxy

  return {
    document,
    getPage,
  }
}

describe(
  'PdfTextSearchService',
  () => {
    it(
      'rejeita documento sem páginas',
      async () => {
        const service =
          new PdfTextSearchService()

        const {
          document,
          getPage,
        } =
          createPdfDocument(
            [],
            0,
          )

        const onProgress =
          vi.fn()

        let caughtError:
          unknown

        try {
          await service.search(
            document,
            'internet',
            {
              onProgress,
            },
          )
        } catch (error) {
          caughtError =
            error
        }

        expect(
          caughtError,
        ).toBeInstanceOf(
          PdfTextSearchError,
        )

        const searchError =
          caughtError as
            PdfTextSearchError

        expect(
          searchError.code,
        ).toBe(
          PdfTextSearchErrorCode
            .DOCUMENT_HAS_NO_PAGES,
        )

        expect(
          searchError.pageNumber,
        ).toBeNull()

        expect(
          searchError.totalPages,
        ).toBe(
          0,
        )

        expect(
          getPage,
        ).not.toHaveBeenCalled()

        expect(
          onProgress,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'rejeita termo de pesquisa vazio antes de carregar páginas',
      async () => {
        const page =
          createPdfPage(
            1,
          )

        const {
          document,
          getPage,
        } =
          createPdfDocument([
            page.page,
          ])

        const service =
          new PdfTextSearchService()

        let caughtError:
          unknown

        try {
          await service.search(
            document,
            '   ',
          )
        } catch (error) {
          caughtError =
            error
        }

        expect(
          caughtError,
        ).toBeInstanceOf(
          PdfTextSearchError,
        )

        const searchError =
          caughtError as
            PdfTextSearchError

        expect(
          searchError.code,
        ).toBe(
          PdfTextSearchErrorCode
            .INVALID_QUERY,
        )

        expect(
          searchError.pageNumber,
        ).toBeNull()

        expect(
          searchError.totalPages,
        ).toBe(
          1,
        )

        expect(
          getPage,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'pesquisa todas as páginas e informa o progresso',
      async () => {
        const firstPage =
          createPdfPage(
            1,
          )

        const secondPage =
          createPdfPage(
            2,
          )

        const {
          document,
          getPage,
        } =
          createPdfDocument([
            firstPage.page,
            secondPage.page,
          ])

        const onProgress =
          vi.fn()

        const service =
          new PdfTextSearchService()

        const result =
          await service.search(
            document,
            '  internet  ',
            {
              onProgress,
            },
          )

        expect(
          result,
        ).toEqual({
          query:
            'internet',

          totalPagesSearched:
            2,

          totalOccurrences:
            0,

          pagesWithOccurrences:
            0,

          pageResults:
            [],
        })

        expect(
          getPage,
        ).toHaveBeenCalledTimes(
          2,
        )

        expect(
          getPage,
        ).toHaveBeenNthCalledWith(
          1,
          1,
        )

        expect(
          getPage,
        ).toHaveBeenNthCalledWith(
          2,
          2,
        )

        expect(
          firstPage
            .getTextContent,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          secondPage
            .getTextContent,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          onProgress.mock.calls,
        ).toEqual([
          [
            {
              completedPages:
                1,

              totalPages:
                2,
            },
          ],
          [
            {
              completedPages:
                2,

              totalPages:
                2,
            },
          ],
        ])
      },
    )

    it(
      'trunca quantidade fracionária de páginas',
      async () => {
        const firstPage =
          createPdfPage(
            1,
          )

        const secondPage =
          createPdfPage(
            2,
          )

        const {
          document,
          getPage,
        } =
          createPdfDocument(
            [
              firstPage.page,
              secondPage.page,
            ],
            2.9,
          )

        const service =
          new PdfTextSearchService()

        const result =
          await service.search(
            document,
            'teste',
          )

        expect(
          result
            .totalPagesSearched,
        ).toBe(
          2,
        )

        expect(
          getPage,
        ).toHaveBeenCalledTimes(
          2,
        )

        expect(
          getPage,
        ).not.toHaveBeenCalledWith(
          3,
        )
      },
    )

    it(
      'converte falha ao carregar página em erro de domínio',
      async () => {
        const originalError =
          new Error(
            'Falha simulada no getPage.',
          )

        const getPage =
          vi.fn()
            .mockRejectedValue(
              originalError,
            )

        const document = {
          numPages: 3,
          getPage,
        } as unknown as
          PDFDocumentProxy

        const service =
          new PdfTextSearchService()

        const onProgress =
          vi.fn()

        let caughtError:
          unknown

        try {
          await service.search(
            document,
            'internet',
            {
              onProgress,
            },
          )
        } catch (error) {
          caughtError =
            error
        }

        expect(
          caughtError,
        ).toBeInstanceOf(
          PdfTextSearchError,
        )

        const searchError =
          caughtError as
            PdfTextSearchError

        expect(
          searchError.code,
        ).toBe(
          PdfTextSearchErrorCode
            .PAGE_LOAD_FAILED,
        )

        expect(
          searchError.pageNumber,
        ).toBe(
          1,
        )

        expect(
          searchError.totalPages,
        ).toBe(
          3,
        )

        expect(
          searchError.cause,
        ).toBe(
          originalError,
        )

        expect(
          onProgress,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'converte falha de extração de texto em erro de domínio',
      async () => {
        const originalError =
          new Error(
            'Falha simulada no getTextContent.',
          )

        const page =
          createPdfPage(
            1,
          )

        page
          .getTextContent
          .mockRejectedValue(
            originalError,
          )

        const {
          document,
        } =
          createPdfDocument([
            page.page,
          ])

        const service =
          new PdfTextSearchService()

        const onProgress =
          vi.fn()

        let caughtError:
          unknown

        try {
          await service.search(
            document,
            'internet',
            {
              onProgress,
            },
          )
        } catch (error) {
          caughtError =
            error
        }

        expect(
          caughtError,
        ).toBeInstanceOf(
          PdfTextSearchError,
        )

        const searchError =
          caughtError as
            PdfTextSearchError

        expect(
          searchError.code,
        ).toBe(
          PdfTextSearchErrorCode
            .TEXT_EXTRACTION_FAILED,
        )

        expect(
          searchError.pageNumber,
        ).toBe(
          1,
        )

        expect(
          searchError.totalPages,
        ).toBe(
          1,
        )

        expect(
          searchError.cause,
        ).toBe(
          originalError,
        )

        expect(
          onProgress,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'reutiliza o texto extraído da página em pesquisas posteriores',
      async () => {
        const page =
          createPdfPage(
            1,
          )

        const {
          document,
          getPage,
        } =
          createPdfDocument([
            page.page,
          ])

        const service =
          new PdfTextSearchService()

        await service.search(
          document,
          'primeira',
        )

        await service.search(
          document,
          'segunda',
        )

        expect(
          getPage,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          page.getTextContent,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      'remove do cache uma página cuja extração falhou',
      async () => {
        const page =
          createPdfPage(
            1,
          )

        const originalError =
          new Error(
            'Falha temporária.',
          )

        page
          .getTextContent
          .mockRejectedValueOnce(
            originalError,
          )
          .mockResolvedValueOnce({
            items: [],
            styles: {},
          })

        const {
          document,
          getPage,
        } =
          createPdfDocument([
            page.page,
          ])

        const service =
          new PdfTextSearchService()

        await expect(
          service.search(
            document,
            'primeira',
          ),
        ).rejects.toMatchObject({
          code:
            PdfTextSearchErrorCode
              .TEXT_EXTRACTION_FAILED,

          pageNumber:
            1,

          totalPages:
            1,
        })

        const result =
          await service.search(
            document,
            'segunda',
          )

        expect(
          result
            .totalPagesSearched,
        ).toBe(
          1,
        )

        expect(
          getPage,
        ).toHaveBeenCalledTimes(
          2,
        )

        expect(
          page.getTextContent,
        ).toHaveBeenCalledTimes(
          2,
        )
      },
    )
  },
)
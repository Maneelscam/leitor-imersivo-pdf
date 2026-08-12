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
  PdfPageLoadError,
  PdfPageLoadErrorCode,
} from '@/errors/reader/PdfPageLoadError'
import { PdfPageService } from '@/services/pdf/PdfPageService'

function createPage(
  pageNumber: number,
): PDFPageProxy {
  return {
    pageNumber,
  } as unknown as PDFPageProxy
}

function createDocument(
  numPages: number,
  getPage:
    (pageNumber: number) => Promise<PDFPageProxy>,
): PDFDocumentProxy {
  return {
    numPages,
    getPage,
  } as unknown as PDFDocumentProxy
}

describe('PdfPageService', () => {
  it('carrega uma página válida do documento', async () => {
    const page =
      createPage(3)

    const getPage =
      vi.fn().mockResolvedValue(
        page,
      )

    const document =
      createDocument(
        10,
        getPage,
      )

    const service =
      new PdfPageService()

    await expect(
      service.loadPage(
        document,
        3,
      ),
    ).resolves.toBe(page)

    expect(
      getPage,
    ).toHaveBeenCalledTimes(
      1,
    )

    expect(
      getPage,
    ).toHaveBeenCalledWith(
      3,
    )
  })

  it.each([
    0,
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])(
    'rejeita número de página inválido: %s',
    async (
      pageNumber,
    ) => {
      const getPage =
        vi.fn()

      const document =
        createDocument(
          10,
          getPage,
        )

      const service =
        new PdfPageService()

      try {
        await service.loadPage(
          document,
          pageNumber,
        )

        throw new Error(
          'O carregamento deveria falhar.',
        )
      } catch (error) {
        expect(
          error,
        ).toBeInstanceOf(
          PdfPageLoadError,
        )

        expect(
          error,
        ).toMatchObject({
          code:
            PdfPageLoadErrorCode.INVALID_PAGE_NUMBER,
          pageNumber,
          totalPages:
            10,
        })
      }

      expect(
        getPage,
      ).not.toHaveBeenCalled()
    },
  )

  it('rejeita página acima do total disponível', async () => {
    const getPage =
      vi.fn()

    const document =
      createDocument(
        5,
        getPage,
      )

    const service =
      new PdfPageService()

    await expect(
      service.loadPage(
        document,
        6,
      ),
    ).rejects.toMatchObject({
      name:
        'PdfPageLoadError',
      code:
        PdfPageLoadErrorCode.PAGE_OUT_OF_RANGE,
      pageNumber:
        6,
      totalPages:
        5,
    })

    expect(
      getPage,
    ).not.toHaveBeenCalled()
  })

  it('trata documento sem páginas como fora de alcance', async () => {
    const getPage =
      vi.fn()

    const document =
      createDocument(
        0,
        getPage,
      )

    const service =
      new PdfPageService()

    await expect(
      service.loadPage(
        document,
        1,
      ),
    ).rejects.toMatchObject({
      code:
        PdfPageLoadErrorCode.PAGE_OUT_OF_RANGE,
      pageNumber:
        1,
      totalPages:
        0,
      message:
        'O documento PDF não possui páginas disponíveis.',
    })
  })

  it('normaliza o total de páginas truncando valores fracionários', async () => {
    const getPage =
      vi.fn()

    const document =
      createDocument(
        5.9,
        getPage,
      )

    const service =
      new PdfPageService()

    await expect(
      service.loadPage(
        document,
        6,
      ),
    ).rejects.toMatchObject({
      code:
        PdfPageLoadErrorCode.PAGE_OUT_OF_RANGE,
      totalPages:
        5,
    })

    expect(
      getPage,
    ).not.toHaveBeenCalled()
  })

  it('normaliza total negativo de páginas para zero', async () => {
    const document =
      createDocument(
        -4,
        vi.fn(),
      )

    const service =
      new PdfPageService()

    await expect(
      service.loadPage(
        document,
        1,
      ),
    ).rejects.toMatchObject({
      code:
        PdfPageLoadErrorCode.PAGE_OUT_OF_RANGE,
      totalPages:
        0,
    })
  })

  it('converte falha do PDF.js em PAGE_LOAD_FAILED preservando a causa', async () => {
    const loadError =
      new Error(
        'falha ao carregar página',
      )

    const getPage =
      vi.fn().mockRejectedValue(
        loadError,
      )

    const document =
      createDocument(
        8,
        getPage,
      )

    const service =
      new PdfPageService()

    try {
      await service.loadPage(
        document,
        4,
      )

      throw new Error(
        'O carregamento deveria falhar.',
      )
    } catch (error) {
      expect(
        error,
      ).toBeInstanceOf(
        PdfPageLoadError,
      )

      expect(
        error,
      ).toMatchObject({
        code:
          PdfPageLoadErrorCode.PAGE_LOAD_FAILED,
        pageNumber:
          4,
        totalPages:
          8,
        cause:
          loadError,
      })
    }
  })
})

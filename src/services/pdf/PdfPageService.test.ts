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
    (
      pageNumber: number,
    ) => Promise<PDFPageProxy>,
): PDFDocumentProxy {
  return {
    numPages,
    getPage,
  } as unknown as PDFDocumentProxy
}

describe('PdfPageService', () => {
  it(
    'carrega uma página válida do documento',
    async () => {
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
    },
  )

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

  it(
    'rejeita página acima do total disponível',
    async () => {
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
    },
  )

  it(
    'trata documento sem páginas como fora de alcance',
    async () => {
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
    },
  )

  it(
    'normaliza o total de páginas truncando valores fracionários',
    async () => {
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
    },
  )

  it(
    'normaliza total negativo de páginas para zero',
    async () => {
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
    },
  )

  it(
    'converte falha do PDF.js em PAGE_LOAD_FAILED preservando a causa',
    async () => {
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
    },
  )

  it(
    'reutiliza uma página já carregada no cache',
    async () => {
      const page =
        createPage(4)

      const getPage =
        vi.fn().mockResolvedValue(
          page,
        )

      const document =
        createDocument(
          20,
          getPage,
        )

      const service =
        new PdfPageService()

      const firstResult =
        await service.loadPage(
          document,
          4,
        )

      const secondResult =
        await service.loadPage(
          document,
          4,
        )

      expect(
        firstResult,
      ).toBe(page)

      expect(
        secondResult,
      ).toBe(page)

      expect(
        getPage,
      ).toHaveBeenCalledTimes(
        1,
      )
    },
  )

  it(
    'compartilha o mesmo carregamento quando a mesma página é solicitada simultaneamente',
    async () => {
      const page =
        createPage(7)

      let resolvePage:
        (
          page:
            PDFPageProxy,
        ) => void =
          () => undefined

      const pendingPage =
        new Promise<
          PDFPageProxy
        >(
          (resolve) => {
            resolvePage =
              resolve
          },
        )

      const getPage =
        vi.fn().mockReturnValue(
          pendingPage,
        )

      const document =
        createDocument(
          20,
          getPage,
        )

      const service =
        new PdfPageService()

      const firstLoad =
        service.loadPage(
          document,
          7,
        )

      const secondLoad =
        service.loadPage(
          document,
          7,
        )

      expect(
        getPage,
      ).toHaveBeenCalledTimes(
        1,
      )

      resolvePage(
        page,
      )

      await expect(
        firstLoad,
      ).resolves.toBe(page)

      await expect(
        secondLoad,
      ).resolves.toBe(page)

      expect(
        getPage,
      ).toHaveBeenCalledTimes(
        1,
      )
    },
  )

  it(
    'remove uma página do cache quando o carregamento falha e permite nova tentativa',
    async () => {
      const loadError =
        new Error(
          'falha temporária',
        )

      const recoveredPage =
        createPage(5)

      const getPage =
        vi.fn()
          .mockRejectedValueOnce(
            loadError,
          )
          .mockResolvedValueOnce(
            recoveredPage,
          )

      const document =
        createDocument(
          20,
          getPage,
        )

      const service =
        new PdfPageService()

      await expect(
        service.loadPage(
          document,
          5,
        ),
      ).rejects.toMatchObject({
        code:
          PdfPageLoadErrorCode.PAGE_LOAD_FAILED,
        pageNumber:
          5,
        cause:
          loadError,
      })

      await expect(
        service.loadPage(
          document,
          5,
        ),
      ).resolves.toBe(
        recoveredPage,
      )

      expect(
        getPage,
      ).toHaveBeenCalledTimes(
        2,
      )

      expect(
        getPage,
      ).toHaveBeenNthCalledWith(
        1,
        5,
      )

      expect(
        getPage,
      ).toHaveBeenNthCalledWith(
        2,
        5,
      )
    },
  )

  it(
    'mantém no máximo 12 páginas por documento usando política LRU',
    async () => {
      const getPage =
        vi.fn(
          async (
            pageNumber: number,
          ) =>
            createPage(
              pageNumber,
            ),
        )

      const document =
        createDocument(
          30,
          getPage,
        )

      const service =
        new PdfPageService()

      for (
        let pageNumber = 1;
        pageNumber <= 12;
        pageNumber += 1
      ) {
        await service.loadPage(
          document,
          pageNumber,
        )
      }

      expect(
        getPage,
      ).toHaveBeenCalledTimes(
        12,
      )

      await service.loadPage(
        document,
        1,
      )

      expect(
        getPage,
      ).toHaveBeenCalledTimes(
        12,
      )

      await service.loadPage(
        document,
        13,
      )

      expect(
        getPage,
      ).toHaveBeenCalledTimes(
        13,
      )

      await service.loadPage(
        document,
        1,
      )

      expect(
        getPage,
      ).toHaveBeenCalledTimes(
        13,
      )

      await service.loadPage(
        document,
        2,
      )

      expect(
        getPage,
      ).toHaveBeenCalledTimes(
        14,
      )

      expect(
        getPage,
      ).toHaveBeenLastCalledWith(
        2,
      )
    },
  )

  it(
    'mantém caches independentes para documentos diferentes',
    async () => {
      const firstPage =
        createPage(3)

      const secondPage =
        createPage(3)

      const firstGetPage =
        vi.fn().mockResolvedValue(
          firstPage,
        )

      const secondGetPage =
        vi.fn().mockResolvedValue(
          secondPage,
        )

      const firstDocument =
        createDocument(
          10,
          firstGetPage,
        )

      const secondDocument =
        createDocument(
          10,
          secondGetPage,
        )

      const service =
        new PdfPageService()

      await expect(
        service.loadPage(
          firstDocument,
          3,
        ),
      ).resolves.toBe(
        firstPage,
      )

      await expect(
        service.loadPage(
          secondDocument,
          3,
        ),
      ).resolves.toBe(
        secondPage,
      )

      await service.loadPage(
        firstDocument,
        3,
      )

      await service.loadPage(
        secondDocument,
        3,
      )

      expect(
        firstGetPage,
      ).toHaveBeenCalledTimes(
        1,
      )

      expect(
        secondGetPage,
      ).toHaveBeenCalledTimes(
        1,
      )
    },
  )
})
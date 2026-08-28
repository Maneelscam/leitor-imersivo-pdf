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

import { LoadPdfPageController } from '@/controllers/reader/LoadPdfPageController'
import type { PdfPageService } from '@/services/pdf/PdfPageService'

function createDocument(
  numPages = 10,
): PDFDocumentProxy {
  return {
    numPages,
  } as unknown as PDFDocumentProxy
}

function createPage(
  pageNumber = 3,
): PDFPageProxy {
  return {
    pageNumber,
  } as unknown as PDFPageProxy
}

describe('LoadPdfPageController', () => {
  it(
    'delega o carregamento ao PdfPageService, retorna a página e pré-carrega a próxima',
    async () => {
      const document =
        createDocument(10)

      const page =
        createPage(3)

      const nextPage =
        createPage(4)

      const loadPage =
        vi.fn()
          .mockResolvedValueOnce(
            page,
          )
          .mockResolvedValueOnce(
            nextPage,
          )

      const service = {
        loadPage,
      } as unknown as PdfPageService

      const controller =
        new LoadPdfPageController(
          service,
        )

      await expect(
        controller.execute(
          document,
          3,
        ),
      ).resolves.toBe(page)

      expect(
        loadPage,
      ).toHaveBeenCalledTimes(
        2,
      )

      expect(
        loadPage,
      ).toHaveBeenNthCalledWith(
        1,
        document,
        3,
      )

      expect(
        loadPage,
      ).toHaveBeenNthCalledWith(
        2,
        document,
        4,
      )
    },
  )

  it(
    'não tenta pré-carregar uma página depois da última página do documento',
    async () => {
      const document =
        createDocument(10)

      const lastPage =
        createPage(10)

      const loadPage =
        vi.fn().mockResolvedValue(
          lastPage,
        )

      const service = {
        loadPage,
      } as unknown as PdfPageService

      const controller =
        new LoadPdfPageController(
          service,
        )

      await expect(
        controller.execute(
          document,
          10,
        ),
      ).resolves.toBe(
        lastPage,
      )

      expect(
        loadPage,
      ).toHaveBeenCalledTimes(
        1,
      )

      expect(
        loadPage,
      ).toHaveBeenCalledWith(
        document,
        10,
      )
    },
  )

  it(
    'não deixa uma falha no pré-carregamento interromper a página atual',
    async () => {
      const document =
        createDocument(10)

      const page =
        createPage(5)

      const prefetchError =
        new Error(
          'falha no pré-carregamento',
        )

      const loadPage =
        vi.fn()
          .mockResolvedValueOnce(
            page,
          )
          .mockRejectedValueOnce(
            prefetchError,
          )

      const service = {
        loadPage,
      } as unknown as PdfPageService

      const controller =
        new LoadPdfPageController(
          service,
        )

      await expect(
        controller.execute(
          document,
          5,
        ),
      ).resolves.toBe(page)

      expect(
        loadPage,
      ).toHaveBeenCalledTimes(
        2,
      )

      expect(
        loadPage,
      ).toHaveBeenNthCalledWith(
        2,
        document,
        6,
      )
    },
  )

  it(
    'propaga a falha da página solicitada sem iniciar pré-carregamento',
    async () => {
      const serviceError =
        new Error(
          'falha do serviço',
        )

      const loadPage =
        vi.fn().mockRejectedValue(
          serviceError,
        )

      const service = {
        loadPage,
      } as unknown as PdfPageService

      const controller =
        new LoadPdfPageController(
          service,
        )

      await expect(
        controller.execute(
          createDocument(),
          2,
        ),
      ).rejects.toBe(
        serviceError,
      )

      expect(
        loadPage,
      ).toHaveBeenCalledTimes(
        1,
      )
    },
  )
})
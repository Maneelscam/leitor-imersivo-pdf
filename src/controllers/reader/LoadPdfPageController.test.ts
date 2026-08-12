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

function createDocument(): PDFDocumentProxy {
  return {
    numPages: 10,
  } as unknown as PDFDocumentProxy
}

function createPage(): PDFPageProxy {
  return {
    pageNumber: 3,
  } as unknown as PDFPageProxy
}

describe('LoadPdfPageController', () => {
  it('delega o carregamento ao PdfPageService e retorna a página', async () => {
    const document =
      createDocument()

    const page =
      createPage()

    const loadPage =
      vi.fn().mockResolvedValue(
        page,
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
      1,
    )

    expect(
      loadPage,
    ).toHaveBeenCalledWith(
      document,
      3,
    )
  })

  it('propaga a falha retornada pelo PdfPageService', async () => {
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
  })
})

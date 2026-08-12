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

import { LoadSecondaryPdfPageController } from '@/controllers/reader/LoadSecondaryPdfPageController'
import type { PdfPageService } from '@/services/pdf/PdfPageService'

function createDocument(
  numPages: number,
): PDFDocumentProxy {
  return {
    numPages,
  } as unknown as PDFDocumentProxy
}

function createPage(
  pageNumber: number,
): PDFPageProxy {
  return {
    pageNumber,
  } as unknown as PDFPageProxy
}

function createService(): {
  readonly service: PdfPageService
  readonly loadPage: ReturnType<typeof vi.fn>
} {
  const loadPage =
    vi.fn(
      async (
        _document: PDFDocumentProxy,
        pageNumber: number,
      ) =>
        createPage(
          pageNumber,
        ),
    )

  return {
    service: {
      loadPage,
    } as unknown as PdfPageService,
    loadPage,
  }
}

describe('LoadSecondaryPdfPageController', () => {
  it.each([
    0,
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])(
    'retorna null para página primária inválida: %s',
    async (
      primaryPageNumber,
    ) => {
      const {
        service,
        loadPage,
      } =
        createService()

      const controller =
        new LoadSecondaryPdfPageController(
          service,
        )

      await expect(
        controller.execute({
          document:
            createDocument(10),
          primaryPageNumber,
          totalPages:
            10,
        }),
      ).resolves.toBeNull()

      expect(
        loadPage,
      ).not.toHaveBeenCalled()
    },
  )

  it('carrega a página imediatamente seguinte à página primária', async () => {
    const document =
      createDocument(10)

    const {
      service,
      loadPage,
    } =
      createService()

    const controller =
      new LoadSecondaryPdfPageController(
        service,
      )

    const result =
      await controller.execute({
        document,
        primaryPageNumber:
          4,
        totalPages:
          10,
      })

    expect(
      result?.pageNumber,
    ).toBe(
      5,
    )

    expect(
      loadPage,
    ).toHaveBeenCalledWith(
      document,
      5,
    )
  })

  it('retorna null quando a página primária já é a última página disponível', async () => {
    const {
      service,
      loadPage,
    } =
      createService()

    const controller =
      new LoadSecondaryPdfPageController(
        service,
      )

    await expect(
      controller.execute({
        document:
          createDocument(10),
        primaryPageNumber:
          10,
        totalPages:
          10,
      }),
    ).resolves.toBeNull()

    expect(
      loadPage,
    ).not.toHaveBeenCalled()
  })

  it('respeita totalPages menor que o total real do documento', async () => {
    const {
      service,
      loadPage,
    } =
      createService()

    const controller =
      new LoadSecondaryPdfPageController(
        service,
      )

    await expect(
      controller.execute({
        document:
          createDocument(10),
        primaryPageNumber:
          5,
        totalPages:
          5,
      }),
    ).resolves.toBeNull()

    expect(
      loadPage,
    ).not.toHaveBeenCalled()
  })

  it('limita totalPages informado ao total real do documento', async () => {
    const {
      service,
      loadPage,
    } =
      createService()

    const controller =
      new LoadSecondaryPdfPageController(
        service,
      )

    await expect(
      controller.execute({
        document:
          createDocument(4),
        primaryPageNumber:
          4,
        totalPages:
          100,
      }),
    ).resolves.toBeNull()

    expect(
      loadPage,
    ).not.toHaveBeenCalled()
  })

  it.each([
    0,
    -1,
    2.5,
    Number.NaN,
  ])(
    'usa document.numPages quando totalPages é inválido: %s',
    async (
      totalPages,
    ) => {
      const {
        service,
        loadPage,
      } =
        createService()

      const document =
        createDocument(6)

      const controller =
        new LoadSecondaryPdfPageController(
          service,
        )

      const result =
        await controller.execute({
          document,
          primaryPageNumber:
            5,
          totalPages,
        })

      expect(
        result?.pageNumber,
      ).toBe(
        6,
      )

      expect(
        loadPage,
      ).toHaveBeenCalledWith(
        document,
        6,
      )
    },
  )

  it('propaga falha do PdfPageService ao carregar a página secundária', async () => {
    const serviceError =
      new Error(
        'falha ao carregar página secundária',
      )

    const loadPage =
      vi.fn().mockRejectedValue(
        serviceError,
      )

    const controller =
      new LoadSecondaryPdfPageController({
        loadPage,
      } as unknown as PdfPageService)

    await expect(
      controller.execute({
        document:
          createDocument(10),
        primaryPageNumber:
          3,
        totalPages:
          10,
      }),
    ).rejects.toBe(
      serviceError,
    )
  })
})

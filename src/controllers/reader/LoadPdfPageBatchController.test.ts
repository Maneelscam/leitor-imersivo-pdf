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

import { LoadPdfPageBatchController } from '@/controllers/reader/LoadPdfPageBatchController'
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

describe('LoadPdfPageBatchController', () => {
  it('retorna lote vazio quando o documento não possui páginas', async () => {
    const {
      service,
      loadPage,
    } =
      createService()

    const controller =
      new LoadPdfPageBatchController(
        service,
      )

    await expect(
      controller.execute({
        document:
          createDocument(0),
        startPage:
          1,
      }),
    ).resolves.toEqual({
      pages: [],
      startPage:
        0,
      endPage:
        0,
      hasPreviousPages:
        false,
      hasNextPages:
        false,
    })

    expect(
      loadPage,
    ).not.toHaveBeenCalled()
  })

  it('carrega quatro páginas por padrão', async () => {
    const document =
      createDocument(10)

    const {
      service,
      loadPage,
    } =
      createService()

    const controller =
      new LoadPdfPageBatchController(
        service,
      )

    const result =
      await controller.execute({
        document,
        startPage:
          1,
      })

    expect(
      result.pages.map(
        (page) =>
          page.pageNumber,
      ),
    ).toEqual([
      1,
      2,
      3,
      4,
    ])

    expect(result).toMatchObject({
      startPage:
        1,
      endPage:
        4,
      hasPreviousPages:
        false,
      hasNextPages:
        true,
    })

    expect(
      loadPage,
    ).toHaveBeenCalledTimes(
      4,
    )
  })

  it('limita o fim do lote ao total de páginas', async () => {
    const {
      service,
    } =
      createService()

    const controller =
      new LoadPdfPageBatchController(
        service,
      )

    const result =
      await controller.execute({
        document:
          createDocument(6),
        startPage:
          5,
      })

    expect(
      result.pages.map(
        (page) =>
          page.pageNumber,
      ),
    ).toEqual([
      5,
      6,
    ])

    expect(result).toMatchObject({
      startPage:
        5,
      endPage:
        6,
      hasPreviousPages:
        true,
      hasNextPages:
        false,
    })
  })

  it('normaliza startPage abaixo de 1 para a primeira página', async () => {
    const {
      service,
    } =
      createService()

    const controller =
      new LoadPdfPageBatchController(
        service,
      )

    const result =
      await controller.execute({
        document:
          createDocument(8),
        startPage:
          -10,
        batchSize:
          2,
      })

    expect(result).toMatchObject({
      startPage:
        1,
      endPage:
        2,
      hasPreviousPages:
        false,
      hasNextPages:
        true,
    })
  })

  it('normaliza startPage acima do total para a última página', async () => {
    const {
      service,
    } =
      createService()

    const controller =
      new LoadPdfPageBatchController(
        service,
      )

    const result =
      await controller.execute({
        document:
          createDocument(8),
        startPage:
          99,
      })

    expect(
      result.pages.map(
        (page) =>
          page.pageNumber,
      ),
    ).toEqual([
      8,
    ])

    expect(result).toMatchObject({
      startPage:
        8,
      endPage:
        8,
      hasPreviousPages:
        true,
      hasNextPages:
        false,
    })
  })

  it('normaliza startPage não finito para a primeira página', async () => {
    const {
      service,
    } =
      createService()

    const controller =
      new LoadPdfPageBatchController(
        service,
      )

    const result =
      await controller.execute({
        document:
          createDocument(8),
        startPage:
          Number.NaN,
        batchSize:
          1,
      })

    expect(result).toMatchObject({
      startPage:
        1,
      endPage:
        1,
    })
  })

  it('respeita totalPages menor que o total real do documento', async () => {
    const {
      service,
    } =
      createService()

    const controller =
      new LoadPdfPageBatchController(
        service,
      )

    const result =
      await controller.execute({
        document:
          createDocument(20),
        startPage:
          8,
        batchSize:
          5,
        totalPages:
          10,
      })

    expect(
      result.pages.map(
        (page) =>
          page.pageNumber,
      ),
    ).toEqual([
      8,
      9,
      10,
    ])

    expect(result).toMatchObject({
      endPage:
        10,
      hasNextPages:
        false,
    })
  })

  it.each([
    undefined,
    0,
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])(
    'usa o tamanho padrão para batchSize inválido: %s',
    async (
      batchSize,
    ) => {
      const {
        service,
      } =
        createService()

      const controller =
        new LoadPdfPageBatchController(
          service,
        )

      const result =
        await controller.execute({
          document:
            createDocument(20),
          startPage:
            1,
          ...(
            batchSize === undefined
              ? {}
              : {
                  batchSize,
                }
          ),
        })

      expect(
        result.pages,
      ).toHaveLength(
        4,
      )

      expect(
        result.endPage,
      ).toBe(
        4,
      )
    },
  )

  it('limita batchSize ao máximo de 12 páginas', async () => {
    const {
      service,
    } =
      createService()

    const controller =
      new LoadPdfPageBatchController(
        service,
      )

    const result =
      await controller.execute({
        document:
          createDocument(30),
        startPage:
          1,
        batchSize:
          100,
      })

    expect(
      result.pages,
    ).toHaveLength(
      12,
    )

    expect(
      result.endPage,
    ).toBe(
      12,
    )
  })

  it('trunca batchSize fracionário', async () => {
    const {
      service,
    } =
      createService()

    const controller =
      new LoadPdfPageBatchController(
        service,
      )

    const result =
      await controller.execute({
        document:
          createDocument(10),
        startPage:
          2,
        batchSize:
          2.9,
      })

    expect(
      result.pages.map(
        (page) =>
          page.pageNumber,
      ),
    ).toEqual([
      2,
      3,
    ])
  })

  it('usa o total real do documento quando totalPages é inválido', async () => {
    const {
      service,
    } =
      createService()

    const controller =
      new LoadPdfPageBatchController(
        service,
      )

    const result =
      await controller.execute({
        document:
          createDocument(6),
        startPage:
          5,
        batchSize:
          4,
        totalPages:
          Number.NaN,
      })

    expect(
      result.endPage,
    ).toBe(
      6,
    )

    expect(
      result.hasNextPages,
    ).toBe(
      false,
    )
  })

  it('propaga a primeira falha do PdfPageService e interrompe o lote', async () => {
    const failure =
      new Error(
        'falha na página 3',
      )

    const loadPage =
      vi.fn(
        async (
          _document: PDFDocumentProxy,
          pageNumber: number,
        ) => {
          if (pageNumber === 3) {
            throw failure
          }

          return createPage(
            pageNumber,
          )
        },
      )

    const controller =
      new LoadPdfPageBatchController({
        loadPage,
      } as unknown as PdfPageService)

    await expect(
      controller.execute({
        document:
          createDocument(10),
        startPage:
          1,
        batchSize:
          5,
      }),
    ).rejects.toBe(
      failure,
    )

    expect(
      loadPage,
    ).toHaveBeenCalledTimes(
      3,
    )

    expect(
      loadPage.mock.calls.map(
        (call) =>
          call[1],
      ),
    ).toEqual([
      1,
      2,
      3,
    ])
  })
})
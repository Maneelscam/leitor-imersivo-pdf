import type {
  PDFDocumentProxy,
  PDFPageProxy,
} from 'pdfjs-dist'

import type {
  PdfPageService,
} from '@/services/pdf/PdfPageService'

const DEFAULT_BATCH_SIZE = 4
const MAXIMUM_BATCH_SIZE = 12

export interface LoadPdfPageBatchQuery {
  readonly document: PDFDocumentProxy
  readonly startPage: number

  readonly batchSize?: number
  readonly totalPages?: number
}

export interface LoadPdfPageBatchResult {
  readonly pages:
    readonly PDFPageProxy[]

  readonly startPage: number
  readonly endPage: number

  readonly hasPreviousPages: boolean
  readonly hasNextPages: boolean
}

function normalizeTotalPages(
  document: PDFDocumentProxy,
  totalPages: number | undefined,
): number {
  const documentTotalPages = Math.max(
    0,
    Math.trunc(document.numPages),
  )

  if (
    totalPages === undefined ||
    !Number.isFinite(totalPages) ||
    totalPages <= 0
  ) {
    return documentTotalPages
  }

  return Math.min(
    Math.trunc(totalPages),
    documentTotalPages,
  )
}

function normalizeStartPage(
  startPage: number,
  totalPages: number,
): number {
  if (
    !Number.isFinite(startPage) ||
    totalPages <= 0
  ) {
    return 1
  }

  return Math.min(
    Math.max(
      Math.trunc(startPage),
      1,
    ),
    totalPages,
  )
}

function normalizeBatchSize(
  batchSize: number | undefined,
): number {
  if (
    batchSize === undefined ||
    !Number.isFinite(batchSize) ||
    batchSize <= 0
  ) {
    return DEFAULT_BATCH_SIZE
  }

  return Math.min(
    Math.max(
      Math.trunc(batchSize),
      1,
    ),
    MAXIMUM_BATCH_SIZE,
  )
}

export class LoadPdfPageBatchController {
  constructor(
    private readonly pdfPageService:
      PdfPageService,
  ) {}

  async execute(
    query: LoadPdfPageBatchQuery,
  ): Promise<LoadPdfPageBatchResult> {
    const totalPages =
      normalizeTotalPages(
        query.document,
        query.totalPages,
      )

    if (totalPages <= 0) {
      return {
        pages: [],
        startPage: 0,
        endPage: 0,
        hasPreviousPages: false,
        hasNextPages: false,
      }
    }

    const startPage =
      normalizeStartPage(
        query.startPage,
        totalPages,
      )

    const batchSize =
      normalizeBatchSize(
        query.batchSize,
      )

    const endPage = Math.min(
      startPage + batchSize - 1,
      totalPages,
    )

    const pages: PDFPageProxy[] = []

    for (
      let pageNumber = startPage;
      pageNumber <= endPage;
      pageNumber += 1
    ) {
      const page =
        await this.pdfPageService.loadPage(
          query.document,
          pageNumber,
        )

      pages.push(page)
    }

    return {
      pages,
      startPage,
      endPage,
      hasPreviousPages:
        startPage > 1,
      hasNextPages:
        endPage < totalPages,
    }
  }
}
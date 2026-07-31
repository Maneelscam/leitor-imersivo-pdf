import type {
  PDFDocumentProxy,
  PDFPageProxy,
} from 'pdfjs-dist'

import type {
  PdfPageService,
} from '@/services/pdf/PdfPageService'

export interface LoadSecondaryPdfPageQuery {
  readonly document: PDFDocumentProxy
  readonly primaryPageNumber: number
  readonly totalPages: number
}

function normalizeTotalPages(
  document: PDFDocumentProxy,
  totalPages: number,
): number {
  if (
    Number.isInteger(totalPages) &&
    totalPages > 0
  ) {
    return Math.min(
      totalPages,
      document.numPages,
    )
  }

  return document.numPages
}

export class LoadSecondaryPdfPageController {
  constructor(
    private readonly pdfPageService:
      PdfPageService,
  ) {}

  async execute(
    query: LoadSecondaryPdfPageQuery,
  ): Promise<PDFPageProxy | null> {
    const {
      document,
      primaryPageNumber,
      totalPages,
    } = query

    if (
      !Number.isInteger(
        primaryPageNumber,
      ) ||
      primaryPageNumber < 1
    ) {
      return null
    }

    const normalizedTotalPages =
      normalizeTotalPages(
        document,
        totalPages,
      )

    const secondaryPageNumber =
      primaryPageNumber + 1

    if (
      secondaryPageNumber >
      normalizedTotalPages
    ) {
      return null
    }

    return this.pdfPageService.loadPage(
      document,
      secondaryPageNumber,
    )
  }
}
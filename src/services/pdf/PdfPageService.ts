import type {
  PDFDocumentProxy,
  PDFPageProxy,
} from 'pdfjs-dist'

import {
  PdfPageLoadError,
  PdfPageLoadErrorCode,
} from '@/errors/reader/PdfPageLoadError'

export class PdfPageService {
  async loadPage(
    document: PDFDocumentProxy,
    pageNumber: number,
  ): Promise<PDFPageProxy> {
    const totalPages = Math.max(
      0,
      Math.trunc(document.numPages),
    )

    if (
      !Number.isFinite(pageNumber) ||
      !Number.isInteger(pageNumber) ||
      pageNumber <= 0
    ) {
      throw new PdfPageLoadError({
        code:
          PdfPageLoadErrorCode.INVALID_PAGE_NUMBER,
        pageNumber,
        totalPages,
      })
    }

    if (
      totalPages === 0 ||
      pageNumber > totalPages
    ) {
      throw new PdfPageLoadError({
        code:
          PdfPageLoadErrorCode.PAGE_OUT_OF_RANGE,
        pageNumber,
        totalPages,
      })
    }

    try {
      return await document.getPage(pageNumber)
    } catch (error: unknown) {
      throw new PdfPageLoadError({
        code:
          PdfPageLoadErrorCode.PAGE_LOAD_FAILED,
        pageNumber,
        totalPages,
        cause: error,
      })
    }
  }
}
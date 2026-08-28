import type {
  PDFDocumentProxy,
  PDFPageProxy,
} from 'pdfjs-dist'

import type {
  PdfPageService,
} from '@/services/pdf/PdfPageService'

export class LoadPdfPageController {
  constructor(
    private readonly pdfPageService:
      PdfPageService,
  ) {}

  async execute(
    document: PDFDocumentProxy,
    pageNumber: number,
    prefetchPageNumber?: number,
  ): Promise<PDFPageProxy> {
    const page =
      await this.pdfPageService.loadPage(
        document,
        pageNumber,
      )

    this.prefetchPage(
      document,
      prefetchPageNumber ??
        page.pageNumber + 1,
    )

    return page
  }

  private prefetchPage(
    document: PDFDocumentProxy,
    pageNumber: number,
  ): void {
    const totalPages =
      Math.max(
        0,
        Math.trunc(
          document.numPages,
        ),
      )

    if (
      !Number.isInteger(
        pageNumber,
      ) ||
      pageNumber < 1 ||
      pageNumber > totalPages
    ) {
      return
    }

    void this.pdfPageService
      .loadPage(
        document,
        pageNumber,
      )
      .catch(
        () => undefined,
      )
  }
}
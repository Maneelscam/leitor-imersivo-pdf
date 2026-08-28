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
  ): Promise<PDFPageProxy> {
    const page =
      await this.pdfPageService.loadPage(
        document,
        pageNumber,
      )

    this.prefetchNextPage(
      document,
      page,
    )

    return page
  }

  private prefetchNextPage(
    document: PDFDocumentProxy,
    page: PDFPageProxy,
  ): void {
    const totalPages =
      Math.max(
        0,
        Math.trunc(
          document.numPages,
        ),
      )

    const nextPageNumber =
      page.pageNumber + 1

    if (
      nextPageNumber >
      totalPages
    ) {
      return
    }

    void this.pdfPageService
      .loadPage(
        document,
        nextPageNumber,
      )
      .catch(
        () => undefined,
      )
  }
}
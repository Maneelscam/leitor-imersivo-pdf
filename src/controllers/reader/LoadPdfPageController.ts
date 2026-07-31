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
    return this.pdfPageService.loadPage(
      document,
      pageNumber,
    )
  }
}
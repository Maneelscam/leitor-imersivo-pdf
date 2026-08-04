import type {
  PDFDocumentProxy,
} from 'pdfjs-dist'

import type {
  PdfTextSearchResult,
} from '@/models/dtos/PdfTextSearchResult'
import type {
  PdfTextSearchOptions,
  PdfTextSearchService,
} from '@/services/pdf/PdfTextSearchService'

export class SearchPdfTextController {
  constructor(
    private readonly pdfTextSearchService:
      PdfTextSearchService,
  ) {}

  async execute(
    document: PDFDocumentProxy,
    query: string,
    options: PdfTextSearchOptions = {},
  ): Promise<PdfTextSearchResult> {
    return this.pdfTextSearchService.search(
      document,
      query,
      options,
    )
  }
}
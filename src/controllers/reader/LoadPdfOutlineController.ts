import type {
  PDFDocumentProxy,
} from 'pdfjs-dist'

import type {
  PdfOutlineItem,
} from '@/models/dtos/PdfOutlineItem'
import type {
  PdfOutlineService,
} from '@/services/pdf/PdfOutlineService'

export class LoadPdfOutlineController {
  constructor(
    private readonly pdfOutlineService:
      PdfOutlineService,
  ) {}

  async execute(
    document: PDFDocumentProxy,
  ): Promise<
    readonly PdfOutlineItem[]
  > {
    return this.pdfOutlineService.load(
      document,
    )
  }
}
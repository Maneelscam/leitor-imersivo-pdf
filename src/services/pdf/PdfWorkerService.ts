import { GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

let isPdfWorkerConfigured = false

export class PdfWorkerService {
  configure(): void {
    if (isPdfWorkerConfigured) {
      return
    }

    GlobalWorkerOptions.workerSrc = pdfWorkerUrl
    isPdfWorkerConfigured = true
  }

  isConfigured(): boolean {
    return isPdfWorkerConfigured
  }
}
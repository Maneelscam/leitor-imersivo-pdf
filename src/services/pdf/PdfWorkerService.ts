import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

import {
  loadPdfJsRuntime,
} from '@/services/pdf/loadPdfJsRuntime'

let isPdfWorkerConfigured = false

let configurePromise:
  Promise<void> | null = null

export class PdfWorkerService {
  async configure(): Promise<void> {
    if (isPdfWorkerConfigured) {
      return
    }

    if (configurePromise !== null) {
      return configurePromise
    }

    configurePromise =
      loadPdfJsRuntime()
        .then(
          ({
            GlobalWorkerOptions,
          }) => {
            if (
              isPdfWorkerConfigured
            ) {
              return
            }

            GlobalWorkerOptions.workerSrc =
              pdfWorkerUrl

            isPdfWorkerConfigured =
              true
          },
        )
        .finally(() => {
          configurePromise = null
        })

    return configurePromise
  }

  isConfigured(): boolean {
    return isPdfWorkerConfigured
  }
}

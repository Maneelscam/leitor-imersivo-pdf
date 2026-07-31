import {
  getDocument,
  PasswordResponses,
  type PDFDocumentLoadingTask,
  type PDFDocumentProxy,
} from 'pdfjs-dist'

import { PdfWorkerService } from '@/services/pdf/PdfWorkerService'
import {
  PdfDocumentError,
  PdfDocumentErrorCode,
} from '@/utils/errors/PdfDocumentError'

export interface OpenPdfDocumentOptions {
  readonly password?: string
}

export interface LoadedPdfDocument {
  readonly document: PDFDocumentProxy
  readonly isClosed: boolean

  close(): Promise<void>
}

class LoadedPdfDocumentHandle
  implements LoadedPdfDocument
{
  private closed = false

  constructor(
    readonly document: PDFDocumentProxy,
    private readonly loadingTask:
      PDFDocumentLoadingTask,
  ) {}

  get isClosed(): boolean {
    return this.closed
  }

  async close(): Promise<void> {
    if (this.closed) {
      return
    }

    this.closed = true

    try {
      await this.loadingTask.destroy()
    } catch (error) {
      throw new PdfDocumentError(
        PdfDocumentErrorCode.DESTROY_FAILED,
        'Não foi possível encerrar corretamente o documento PDF.',
        {
          cause: error,
        },
      )
    }
  }
}

function getErrorName(
  error: unknown,
): string | null {
  if (error instanceof Error) {
    return error.name
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    typeof error.name === 'string'
  ) {
    return error.name
  }

  return null
}

function getErrorCode(
  error: unknown,
): number | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'number'
  ) {
    return error.code
  }

  return null
}

function normalizePdfDocumentError(
  error: unknown,
): PdfDocumentError {
  if (error instanceof PdfDocumentError) {
    return error
  }

  const errorName = getErrorName(error)
  const errorCode = getErrorCode(error)

  if (errorName === 'PasswordException') {
    if (
      errorCode ===
      PasswordResponses.INCORRECT_PASSWORD
    ) {
      return new PdfDocumentError(
        PdfDocumentErrorCode.INVALID_PASSWORD,
        'A senha informada para o PDF está incorreta.',
        {
          cause: error,
        },
      )
    }

    return new PdfDocumentError(
      PdfDocumentErrorCode.PASSWORD_REQUIRED,
      'Este documento PDF está protegido por senha.',
      {
        cause: error,
      },
    )
  }

  if (
    errorName === 'InvalidPDFException' ||
    errorName === 'FormatError'
  ) {
    return new PdfDocumentError(
      PdfDocumentErrorCode.INVALID_DOCUMENT,
      'O documento PDF está corrompido ou possui uma estrutura inválida.',
      {
        cause: error,
      },
    )
  }

  return new PdfDocumentError(
    PdfDocumentErrorCode.LOAD_FAILED,
    'Não foi possível abrir o documento PDF.',
    {
      cause: error,
    },
  )
}

async function destroyLoadingTaskSilently(
  loadingTask:
    PDFDocumentLoadingTask | null,
): Promise<void> {
  if (
    loadingTask === null ||
    loadingTask.destroyed
  ) {
    return
  }

  try {
    await loadingTask.destroy()
  } catch {
    return
  }
}

export class PdfDocumentService {
  constructor(
    private readonly workerService =
      new PdfWorkerService(),
  ) {}

  async open(
    file: Blob,
    options: OpenPdfDocumentOptions = {},
  ): Promise<LoadedPdfDocument> {
    this.workerService.configure()

    let loadingTask:
      PDFDocumentLoadingTask | null = null

    try {
      const fileBuffer =
        await file.arrayBuffer()

      const pdfData =
        new Uint8Array(fileBuffer)

      const parameters = {
        data: pdfData,
        isEvalSupported: false,

        ...(options.password !== undefined
          ? {
              password: options.password,
            }
          : {}),
      }

      loadingTask = getDocument(parameters)

      const document =
        await loadingTask.promise

      return new LoadedPdfDocumentHandle(
        document,
        loadingTask,
      )
    } catch (error) {
      await destroyLoadingTaskSilently(
        loadingTask,
      )

      throw normalizePdfDocumentError(error)
    }
  }
}
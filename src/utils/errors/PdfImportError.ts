export const PdfImportErrorCode = {
  DUPLICATE_DOCUMENT: 'duplicate-document',
  INVALID_PAGE_COUNT: 'invalid-page-count',
  STORAGE_FAILED: 'storage-failed',
} as const

export type PdfImportErrorCode =
  (typeof PdfImportErrorCode)[keyof typeof PdfImportErrorCode]

export class PdfImportError extends Error {
  readonly name = 'PdfImportError'

  constructor(
    readonly code: PdfImportErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)

    Object.setPrototypeOf(this, new.target.prototype)
  }
}
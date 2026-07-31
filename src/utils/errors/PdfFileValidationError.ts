export const PdfFileValidationErrorCode = {
  EMPTY_FILE: 'empty-file',
  INVALID_EXTENSION: 'invalid-extension',
  INVALID_MIME_TYPE: 'invalid-mime-type',
  INVALID_SIGNATURE: 'invalid-signature',
  FILE_READ_FAILED: 'file-read-failed',
} as const

export type PdfFileValidationErrorCode =
  (typeof PdfFileValidationErrorCode)[keyof typeof PdfFileValidationErrorCode]

export class PdfFileValidationError extends Error {
  readonly name = 'PdfFileValidationError'

  constructor(
    readonly code: PdfFileValidationErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)

    Object.setPrototypeOf(this, new.target.prototype)
  }
}
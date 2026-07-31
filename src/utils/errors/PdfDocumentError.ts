export const PdfDocumentErrorCode = {
  LOAD_FAILED: 'load-failed',
  PASSWORD_REQUIRED: 'password-required',
  INVALID_PASSWORD: 'invalid-password',
  INVALID_DOCUMENT: 'invalid-document',
  DESTROY_FAILED: 'destroy-failed',
} as const

export type PdfDocumentErrorCode =
  (typeof PdfDocumentErrorCode)[keyof typeof PdfDocumentErrorCode]

export class PdfDocumentError extends Error {
  readonly name = 'PdfDocumentError'

  constructor(
    readonly code: PdfDocumentErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)

    Object.setPrototypeOf(this, new.target.prototype)
  }
}
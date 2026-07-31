export const ReaderErrorCode = {
  INVALID_PAGE_NUMBER: 'invalid-page-number',
  INVALID_PAGE_OFFSET: 'invalid-page-offset',
  BOOK_NOT_OPEN: 'book-not-open',
  SAVE_PROGRESS_FAILED: 'save-progress-failed',
} as const

export type ReaderErrorCode =
  (typeof ReaderErrorCode)[keyof typeof ReaderErrorCode]

export class ReaderError extends Error {
  readonly name = 'ReaderError'

  constructor(
    readonly code: ReaderErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)

    Object.setPrototypeOf(this, new.target.prototype)
  }
}
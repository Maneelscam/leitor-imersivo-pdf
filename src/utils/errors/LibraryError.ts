export const LibraryErrorCode = {
  LOAD_FAILED: 'load-failed',
  BOOK_NOT_FOUND: 'book-not-found',
  BOOK_FILE_NOT_FOUND: 'book-file-not-found',
  OPEN_FAILED: 'open-failed',
  UPDATE_FAILED: 'update-failed',
  DELETE_FAILED: 'delete-failed',
} as const

export type LibraryErrorCode =
  (typeof LibraryErrorCode)[keyof typeof LibraryErrorCode]

export class LibraryError extends Error {
  readonly name = 'LibraryError'

  constructor(
    readonly code: LibraryErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)

    Object.setPrototypeOf(this, new.target.prototype)
  }
}
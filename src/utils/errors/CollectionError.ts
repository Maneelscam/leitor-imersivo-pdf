export const CollectionErrorCode = {
  LOAD_FAILED: 'load-failed',
  NOT_FOUND: 'not-found',
  BOOK_NOT_FOUND: 'book-not-found',
  NAME_REQUIRED: 'name-required',
  NAME_TOO_LONG: 'name-too-long',
  DESCRIPTION_TOO_LONG:
    'description-too-long',
  DUPLICATE_NAME: 'duplicate-name',
  SAVE_FAILED: 'save-failed',
  DELETE_FAILED: 'delete-failed',
  MEMBERSHIP_SAVE_FAILED:
    'membership-save-failed',
  MEMBERSHIP_DELETE_FAILED:
    'membership-delete-failed',
} as const

export type CollectionErrorCode =
  (typeof CollectionErrorCode)[keyof typeof CollectionErrorCode]

export class CollectionError
extends Error {
  readonly name = 'CollectionError'

  constructor(
    readonly code:
      CollectionErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)

    Object.setPrototypeOf(
      this,
      new.target.prototype,
    )
  }
}

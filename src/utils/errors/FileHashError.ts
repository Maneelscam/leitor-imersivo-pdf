export const FileHashErrorCode = {
  CRYPTO_UNAVAILABLE: 'crypto-unavailable',
  FILE_READ_FAILED: 'file-read-failed',
  HASH_GENERATION_FAILED: 'hash-generation-failed',
} as const

export type FileHashErrorCode =
  (typeof FileHashErrorCode)[keyof typeof FileHashErrorCode]

export class FileHashError extends Error {
  readonly name = 'FileHashError'

  constructor(
    readonly code: FileHashErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)

    Object.setPrototypeOf(this, new.target.prototype)
  }
}
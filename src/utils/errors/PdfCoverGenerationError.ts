export const PdfCoverGenerationErrorCode = {
  PAGE_LOAD_FAILED: 'page-load-failed',
  CANVAS_UNAVAILABLE: 'canvas-unavailable',
  RENDER_FAILED: 'render-failed',
  IMAGE_ENCODING_FAILED: 'image-encoding-failed',
} as const

export type PdfCoverGenerationErrorCode =
  (typeof PdfCoverGenerationErrorCode)[keyof typeof PdfCoverGenerationErrorCode]

export class PdfCoverGenerationError extends Error {
  readonly name = 'PdfCoverGenerationError'

  constructor(
    readonly code: PdfCoverGenerationErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)

    Object.setPrototypeOf(this, new.target.prototype)
  }
}
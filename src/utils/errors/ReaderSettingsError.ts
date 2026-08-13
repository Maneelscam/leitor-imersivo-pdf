export const ReaderSettingsErrorCode = {
  LOAD_FAILED: 'load-failed',

  INVALID_THEME: 'invalid-theme',

  INVALID_PAGE_DISPLAY_MODE:
    'invalid-page-display-mode',

  INVALID_READING_FLOW_MODE:
    'invalid-reading-flow-mode',

  INVALID_ZOOM_MODE:
    'invalid-zoom-mode',

  INVALID_ZOOM_SCALE:
    'invalid-zoom-scale',

  SAVE_FAILED: 'save-failed',
  RESET_FAILED: 'reset-failed',
} as const

export type ReaderSettingsErrorCode =
  (typeof ReaderSettingsErrorCode)[keyof typeof ReaderSettingsErrorCode]

export class ReaderSettingsError extends Error {
  readonly name = 'ReaderSettingsError'

  constructor(
    readonly code: ReaderSettingsErrorCode,
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
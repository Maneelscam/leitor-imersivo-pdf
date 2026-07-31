export const ZoomMode = {
  CUSTOM: 'custom',
  FIT_WIDTH: 'fit-width',
  FIT_PAGE: 'fit-page',
} as const

export type ZoomMode = (typeof ZoomMode)[keyof typeof ZoomMode]

export function isZoomMode(value: unknown): value is ZoomMode {
  return (
    typeof value === 'string' &&
    Object.values(ZoomMode).includes(value as ZoomMode)
  )
}
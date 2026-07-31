export const PageDisplayMode = {
  SINGLE: 'single',
  DOUBLE: 'double',
} as const

export type PageDisplayMode =
  (typeof PageDisplayMode)[keyof typeof PageDisplayMode]

export function isPageDisplayMode(
  value: unknown,
): value is PageDisplayMode {
  return (
    typeof value === 'string' &&
    Object.values(PageDisplayMode).includes(value as PageDisplayMode)
  )
}
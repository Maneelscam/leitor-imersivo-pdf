export const AnnotationType = {
  HIGHLIGHT: 'highlight',
  NOTE: 'note',
} as const

export type AnnotationType =
  (typeof AnnotationType)[keyof typeof AnnotationType]

export function isAnnotationType(
  value: unknown,
): value is AnnotationType {
  return (
    typeof value === 'string' &&
    Object.values(AnnotationType).includes(
      value as AnnotationType,
    )
  )
}
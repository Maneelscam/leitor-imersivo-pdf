export const AnnotationColor = {
  YELLOW: 'yellow',
  GREEN: 'green',
  BLUE: 'blue',
  PINK: 'pink',
} as const

export type AnnotationColor =
  (typeof AnnotationColor)[keyof typeof AnnotationColor]

export function isAnnotationColor(
  value: unknown,
): value is AnnotationColor {
  return (
    typeof value === 'string' &&
    Object.values(AnnotationColor).includes(
      value as AnnotationColor,
    )
  )
}
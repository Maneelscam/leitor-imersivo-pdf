export interface AnnotationArea {
  readonly left: number
  readonly bottom: number
  readonly right: number
  readonly top: number
}

export function isAnnotationArea(
  value: unknown,
): value is AnnotationArea {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return false
  }

  const candidate =
    value as Record<string, unknown>

  const left = candidate.left
  const bottom = candidate.bottom
  const right = candidate.right
  const top = candidate.top

  return (
    typeof left === 'number' &&
    Number.isFinite(left) &&
    typeof bottom === 'number' &&
    Number.isFinite(bottom) &&
    typeof right === 'number' &&
    Number.isFinite(right) &&
    typeof top === 'number' &&
    Number.isFinite(top) &&
    right > left &&
    top > bottom
  )
}
export const ReadingFlowMode = {
  PAGINATED: 'paginated',
  CONTINUOUS: 'continuous',
} as const

export type ReadingFlowMode =
  (typeof ReadingFlowMode)[keyof typeof ReadingFlowMode]

export function isReadingFlowMode(
  value: unknown,
): value is ReadingFlowMode {
  return (
    typeof value === 'string' &&
    Object.values(ReadingFlowMode).includes(value as ReadingFlowMode)
  )
}
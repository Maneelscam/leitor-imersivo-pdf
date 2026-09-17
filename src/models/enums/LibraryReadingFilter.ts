export const LibraryReadingFilter = {
  ALL: 'all',
  NOT_STARTED: 'not-started',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
} as const

export type LibraryReadingFilter =
  (typeof LibraryReadingFilter)[keyof typeof LibraryReadingFilter]

export function isLibraryReadingFilter(
  value: unknown,
): value is LibraryReadingFilter {
  return (
    typeof value === 'string' &&
    Object.values(
      LibraryReadingFilter,
    ).includes(
      value as LibraryReadingFilter,
    )
  )
}

export const LibrarySortMode = {
  RECENTLY_OPENED: 'recently-opened',
  RECENTLY_IMPORTED: 'recently-imported',
  TITLE_ASCENDING: 'title-ascending',
  TITLE_DESCENDING: 'title-descending',
} as const

export type LibrarySortMode =
  (typeof LibrarySortMode)[keyof typeof LibrarySortMode]

export function isLibrarySortMode(
  value: unknown,
): value is LibrarySortMode {
  return (
    typeof value === 'string' &&
    Object.values(LibrarySortMode).includes(
      value as LibrarySortMode,
    )
  )
}
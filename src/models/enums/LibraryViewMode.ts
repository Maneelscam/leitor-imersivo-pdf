export const LibraryViewMode = {
  GRID: 'grid',
  LIST: 'list',
} as const

export type LibraryViewMode =
  (typeof LibraryViewMode)[keyof typeof LibraryViewMode]

export function isLibraryViewMode(
  value: string,
): value is LibraryViewMode {
  return Object.values(
    LibraryViewMode,
  ).includes(
    value as LibraryViewMode,
  )
}

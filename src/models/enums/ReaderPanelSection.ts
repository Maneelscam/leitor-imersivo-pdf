export const ReaderPanelSection = {
  THUMBNAILS: 'thumbnails',
  OUTLINE: 'outline',
  SEARCH: 'search',
  ANNOTATIONS: 'annotations',
  BOOKMARKS: 'bookmarks',
} as const

export type ReaderPanelSection =
  (typeof ReaderPanelSection)[keyof typeof ReaderPanelSection]

export function isReaderPanelSection(
  value: unknown,
): value is ReaderPanelSection {
  return (
    typeof value === 'string' &&
    Object.values(
      ReaderPanelSection,
    ).includes(
      value as ReaderPanelSection,
    )
  )
}
export const DATABASE_STORE_NAMES = {
  BOOKS: 'books',
  BOOK_FILES: 'bookFiles',
  BOOK_COVERS: 'bookCovers',
  READING_PROGRESS: 'readingProgress',
  BOOKMARKS: 'bookmarks',
  ANNOTATIONS: 'annotations',
  READER_SETTINGS: 'readerSettings',
} as const

export type DatabaseStoreName =
  (typeof DATABASE_STORE_NAMES)[keyof typeof DATABASE_STORE_NAMES]
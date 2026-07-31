import type {
  DATABASE_STORE_NAMES,
  DatabaseStoreName,
} from '@/database/stores/databaseStoreNames'
import type { Book } from '@/models/entities/Book'
import type { BookCover } from '@/models/entities/BookCover'
import type { BookFile } from '@/models/entities/BookFile'
import type { Bookmark } from '@/models/entities/Bookmark'
import type { ReaderSettings } from '@/models/entities/ReaderSettings'
import type { ReadingProgress } from '@/models/entities/ReadingProgress'
import type { BookmarkId } from '@/models/value-objects/BookmarkId'
import type { BookId } from '@/models/value-objects/BookId'

export const READER_SETTINGS_RECORD_KEY = 'reader-settings' as const

export interface DatabaseStoreRecordMap {
  [DATABASE_STORE_NAMES.BOOKS]: Book
  [DATABASE_STORE_NAMES.BOOK_FILES]: BookFile
  [DATABASE_STORE_NAMES.BOOK_COVERS]: BookCover
  [DATABASE_STORE_NAMES.READING_PROGRESS]: ReadingProgress
  [DATABASE_STORE_NAMES.BOOKMARKS]: Bookmark
  [DATABASE_STORE_NAMES.READER_SETTINGS]: ReaderSettings
}

export interface DatabaseStoreKeyMap {
  [DATABASE_STORE_NAMES.BOOKS]: BookId
  [DATABASE_STORE_NAMES.BOOK_FILES]: BookId
  [DATABASE_STORE_NAMES.BOOK_COVERS]: BookId
  [DATABASE_STORE_NAMES.READING_PROGRESS]: BookId
  [DATABASE_STORE_NAMES.BOOKMARKS]: BookmarkId
  [DATABASE_STORE_NAMES.READER_SETTINGS]: typeof READER_SETTINGS_RECORD_KEY
}

export type DatabaseRecordFor<TStore extends DatabaseStoreName> =
  DatabaseStoreRecordMap[TStore]

export type DatabaseKeyFor<TStore extends DatabaseStoreName> =
  DatabaseStoreKeyMap[TStore]
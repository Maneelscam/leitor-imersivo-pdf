import type { Book } from '@/models/entities/Book'
import type { BookCover } from '@/models/entities/BookCover'
import type { BookFile } from '@/models/entities/BookFile'
import type { Bookmark } from '@/models/entities/Bookmark'
import type { ReaderSettings } from '@/models/entities/ReaderSettings'
import type { ReadingProgress } from '@/models/entities/ReadingProgress'
import type { BookId } from '@/models/value-objects/BookId'
import type { IsoDateTime } from '@/models/value-objects/IsoDateTime'

export const LIBRARY_BACKUP_FORMAT =
  'leitor-imersivo-pdf-backup' as const

export const LIBRARY_BACKUP_FORMAT_VERSION =
  1 as const

export const LIBRARY_BACKUP_MANIFEST_FILE_NAME =
  'backup.json' as const

export interface LibraryBackupSnapshot {
  readonly books: readonly Book[]
  readonly bookFiles: readonly BookFile[]
  readonly bookCovers: readonly BookCover[]
  readonly readingProgress:
    readonly ReadingProgress[]
  readonly bookmarks: readonly Bookmark[]
  readonly readerSettings:
    ReaderSettings | null
}

export interface LibraryBackupBookFileEntry {
  readonly bookId: BookId

  readonly archivePath: string
  readonly mimeType: 'application/pdf'
  readonly sizeBytes: number

  readonly storedAt: IsoDateTime
}

export interface LibraryBackupBookCoverEntry {
  readonly bookId: BookId

  readonly archivePath: string
  readonly mimeType: 'image/webp'
  readonly sizeBytes: number

  readonly width: number
  readonly height: number

  readonly generatedAt: IsoDateTime
}

export interface LibraryBackupApplicationInfo {
  readonly name: string
  readonly version: string
}

export interface LibraryBackupDatabaseInfo {
  readonly name: string
  readonly version: number
}

export interface LibraryBackupManifestData {
  readonly books: readonly Book[]

  readonly bookFiles:
    readonly LibraryBackupBookFileEntry[]

  readonly bookCovers:
    readonly LibraryBackupBookCoverEntry[]

  readonly readingProgress:
    readonly ReadingProgress[]

  readonly bookmarks:
    readonly Bookmark[]

  readonly readerSettings:
    ReaderSettings | null
}

export interface LibraryBackupManifest {
  readonly format:
    typeof LIBRARY_BACKUP_FORMAT

  readonly formatVersion:
    typeof LIBRARY_BACKUP_FORMAT_VERSION

  readonly createdAt: IsoDateTime

  readonly application:
    LibraryBackupApplicationInfo

  readonly database:
    LibraryBackupDatabaseInfo

  readonly data:
    LibraryBackupManifestData
}
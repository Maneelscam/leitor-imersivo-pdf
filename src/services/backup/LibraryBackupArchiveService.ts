import {
  strToU8,
  zip,
  type AsyncZippable,
} from 'fflate'

import {
  APP_CONFIG,
} from '@/app/config/app.config'
import {
  LIBRARY_BACKUP_FORMAT,
  LIBRARY_BACKUP_FORMAT_VERSION,
  LIBRARY_BACKUP_MANIFEST_FILE_NAME,
  type LibraryBackupBookCoverEntry,
  type LibraryBackupBookFileEntry,
  type LibraryBackupManifest,
  type LibraryBackupSnapshot,
} from '@/models/dtos/LibraryBackup'
import {
  createIsoDateTime,
  type IsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import {
  copyUint8ArrayToArrayBuffer,
} from '@/utils/binary/copyUint8ArrayToArrayBuffer'

const ARCHIVE_MIME_TYPE =
  'application/zip' as const

const PDF_DIRECTORY_NAME =
  'files' as const

const COVER_DIRECTORY_NAME =
  'covers' as const

const PDF_FILE_EXTENSION =
  '.pdf' as const

const COVER_FILE_EXTENSION =
  '.webp' as const

const MANIFEST_COMPRESSION_LEVEL = 6
const BINARY_COMPRESSION_LEVEL = 0

export interface LibraryBackupArchiveResult {
  readonly fileName: string
  readonly archive: Blob
  readonly manifest: LibraryBackupManifest
}

function createSafeArchiveSegment(
  value: string,
): string {
  return encodeURIComponent(
    value.trim(),
  )
}

function createPdfArchivePath(
  bookId: string,
): string {
  return [
    PDF_DIRECTORY_NAME,
    '/',
    createSafeArchiveSegment(bookId),
    PDF_FILE_EXTENSION,
  ].join('')
}

function createCoverArchivePath(
  bookId: string,
): string {
  return [
    COVER_DIRECTORY_NAME,
    '/',
    createSafeArchiveSegment(bookId),
    COVER_FILE_EXTENSION,
  ].join('')
}

function createArchiveFileName(
  createdAt: IsoDateTime,
): string {
  const safeTimestamp =
    createdAt.replace(
      /[:.]/g,
      '-',
    )

  return [
    'leitor-imersivo-pdf-backup-',
    safeTimestamp,
    '.zip',
  ].join('')
}

function createBookFileEntries(
  snapshot: LibraryBackupSnapshot,
): readonly LibraryBackupBookFileEntry[] {
  return snapshot.bookFiles.map(
    (bookFile) => ({
      bookId: bookFile.bookId,

      archivePath:
        createPdfArchivePath(
          bookFile.bookId,
        ),

      mimeType: 'application/pdf',
      sizeBytes: bookFile.file.size,

      storedAt: bookFile.storedAt,
    }),
  )
}

function createBookCoverEntries(
  snapshot: LibraryBackupSnapshot,
): readonly LibraryBackupBookCoverEntry[] {
  return snapshot.bookCovers.map(
    (bookCover) => ({
      bookId: bookCover.bookId,

      archivePath:
        createCoverArchivePath(
          bookCover.bookId,
        ),

      mimeType: 'image/webp',
      sizeBytes: bookCover.image.size,

      width: bookCover.width,
      height: bookCover.height,

      generatedAt:
        bookCover.generatedAt,
    }),
  )
}

function createManifest(
  snapshot: LibraryBackupSnapshot,
  createdAt: IsoDateTime,
): LibraryBackupManifest {
  return {
    format: LIBRARY_BACKUP_FORMAT,

    formatVersion:
      LIBRARY_BACKUP_FORMAT_VERSION,

    createdAt,

    application: {
      name: APP_CONFIG.name,
      version: APP_CONFIG.version,
    },

    database: {
      name: APP_CONFIG.database.name,
      version:
        APP_CONFIG.database.version,
    },

    data: {
      books: snapshot.books,

      bookFiles:
        createBookFileEntries(
          snapshot,
        ),

      bookCovers:
        createBookCoverEntries(
          snapshot,
        ),

      readingProgress:
        snapshot.readingProgress,

      bookmarks:
        snapshot.bookmarks,

      readerSettings:
        snapshot.readerSettings,
    },
  }
}

async function blobToUint8Array(
  blob: Blob,
): Promise<Uint8Array> {
  const arrayBuffer =
    await blob.arrayBuffer()

  return new Uint8Array(
    arrayBuffer,
  )
}

function createZipArchive(
  entries: AsyncZippable,
): Promise<Uint8Array> {
  return new Promise<
    Uint8Array
  >((resolve, reject) => {
    zip(
      entries,
      (error, archiveData) => {
        if (error !== null) {
          reject(
            new Error(
              'Não foi possível compactar o backup da biblioteca.',
              {
                cause: error,
              },
            ),
          )

          return
        }

        resolve(archiveData)
      },
    )
  })
}

async function createArchiveEntries(
  snapshot: LibraryBackupSnapshot,
  manifest: LibraryBackupManifest,
): Promise<AsyncZippable> {
  const entries: AsyncZippable = {
    [LIBRARY_BACKUP_MANIFEST_FILE_NAME]:
      [
        strToU8(
          JSON.stringify(
            manifest,
            null,
            2,
          ),
        ),
        {
          level:
            MANIFEST_COMPRESSION_LEVEL,
        },
      ],
  }

  for (
    const bookFile of
    snapshot.bookFiles
  ) {
    const archivePath =
      createPdfArchivePath(
        bookFile.bookId,
      )

    entries[archivePath] = [
      await blobToUint8Array(
        bookFile.file,
      ),
      {
        level:
          BINARY_COMPRESSION_LEVEL,
      },
    ]
  }

  for (
    const bookCover of
    snapshot.bookCovers
  ) {
    const archivePath =
      createCoverArchivePath(
        bookCover.bookId,
      )

    entries[archivePath] = [
      await blobToUint8Array(
        bookCover.image,
      ),
      {
        level:
          BINARY_COMPRESSION_LEVEL,
      },
    ]
  }

  return entries
}

export class LibraryBackupArchiveService {
  async createArchive(
    snapshot: LibraryBackupSnapshot,
  ): Promise<LibraryBackupArchiveResult> {
    const createdAt =
      createIsoDateTime()

    const manifest =
      createManifest(
        snapshot,
        createdAt,
      )

    const entries =
      await createArchiveEntries(
        snapshot,
        manifest,
      )

    const archiveData =
      await createZipArchive(
        entries,
      )

    const archiveBuffer =
      copyUint8ArrayToArrayBuffer(
        archiveData,
      )

    return {
      fileName:
        createArchiveFileName(
          createdAt,
        ),

      archive: new Blob(
        [archiveBuffer],
        {
          type:
            ARCHIVE_MIME_TYPE,
        },
      ),

      manifest,
    }
  }
}
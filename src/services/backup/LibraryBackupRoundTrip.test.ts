import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  LIBRARY_BACKUP_FORMAT_VERSION_V2,
  type LibraryBackupSnapshot,
} from '@/models/dtos/LibraryBackup'
import type {
  Annotation,
} from '@/models/entities/Annotation'
import type {
  Book,
} from '@/models/entities/Book'
import type {
  BookFile,
} from '@/models/entities/BookFile'
import {
  AnnotationType,
} from '@/models/enums/AnnotationType'
import type {
  AnnotationId,
} from '@/models/value-objects/AnnotationId'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  IsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import {
  LibraryBackupArchiveService,
} from '@/services/backup/LibraryBackupArchiveService'
import {
  LibraryBackupManifestValidationService,
} from '@/services/backup/LibraryBackupManifestValidationService'
import {
  LibraryBackupRestoreService,
} from '@/services/backup/LibraryBackupRestoreService'

const TEST_BOOK_ID =
  'livro-backup-round-trip' as BookId

const TEST_ANNOTATION_ID =
  'anotacao-backup-round-trip' as AnnotationId

const TEST_DATE =
  '2026-08-06T12:00:00.000Z' as IsoDateTime

const PDF_BYTES = [
  37,
  80,
  68,
  70,
  45,
  49,
  46,
  55,
] as const

function createTestBook(): Book {
  return {
    id: TEST_BOOK_ID,

    title:
      'Livro para teste de backup',

    author:
      'Autor de teste',

    originalFileName:
      'livro-backup-round-trip.pdf',

    fileSizeBytes:
      PDF_BYTES.length,

    mimeType:
      'application/pdf',

    totalPages: 8,

    pdfFingerprint:
      'fingerprint-backup-round-trip',

    importedAt:
      TEST_DATE,

    updatedAt:
      TEST_DATE,

    lastOpenedAt:
      TEST_DATE,
  }
}

function createTestBookFile(): BookFile {
  return {
    bookId:
      TEST_BOOK_ID,

    file: new Blob(
      [
        new Uint8Array(
          PDF_BYTES,
        ),
      ],
      {
        type:
          'application/pdf',
      },
    ),

    storedAt:
      TEST_DATE,
  }
}

function createTestAnnotation(): Annotation {
  return {
    id:
      TEST_ANNOTATION_ID,

    bookId:
      TEST_BOOK_ID,

    pageNumber: 3,

    pageOffsetRatio: 0.4,

    type:
      AnnotationType.NOTE,

    content:
      'Anotação preservada no ciclo completo de backup.',

    createdAt:
      TEST_DATE,

    updatedAt:
      TEST_DATE,
  }
}

function createTestSnapshot(): LibraryBackupSnapshot {
  return {
    books: [
      createTestBook(),
    ],

    bookFiles: [
      createTestBookFile(),
    ],

    bookCovers: [],

    readingProgress: [],

    bookmarks: [],

    annotations: [
      createTestAnnotation(),
    ],

    readerSettings: null,
  }
}

describe(
  'Library backup round trip',
  () => {
    it(
      'preserva o PDF e as anotações ao criar e restaurar um ZIP',
      async () => {
        const snapshot =
          createTestSnapshot()

        const archiveService =
          new LibraryBackupArchiveService()

        const restoreService =
          new LibraryBackupRestoreService(
            new LibraryBackupManifestValidationService(),
          )

        const archiveResult =
          await archiveService.createArchive(
            snapshot,
          )

        const archiveFile =
          new File(
            [
              archiveResult.archive,
            ],
            archiveResult.fileName,
            {
              type:
                archiveResult.archive.type,
            },
          )

        const restorePreparation =
          await restoreService.prepareRestore(
            archiveFile,
          )

        expect(
          archiveResult.archive.type,
        ).toBe(
          'application/zip',
        )

        expect(
          restorePreparation.manifest.formatVersion,
        ).toBe(
          LIBRARY_BACKUP_FORMAT_VERSION_V2,
        )

        expect(
          restorePreparation.manifest.data.annotations,
        ).toEqual(
          snapshot.annotations,
        )

        expect(
          restorePreparation.snapshot.annotations,
        ).toEqual(
          snapshot.annotations,
        )

        expect(
          restorePreparation.snapshot.books,
        ).toEqual(
          snapshot.books,
        )

        const restoredBookFile =
          restorePreparation.snapshot.bookFiles[0]

        expect(
          restoredBookFile,
        ).toBeDefined()

        if (
          restoredBookFile === undefined
        ) {
          throw new Error(
            'O PDF restaurado não foi encontrado.',
          )
        }

        const restoredBytes =
          new Uint8Array(
            await restoredBookFile.file.arrayBuffer(),
          )

        expect(
          [...restoredBytes],
        ).toEqual(
          [...PDF_BYTES],
        )
      },
    )
  },
)

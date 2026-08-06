import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'

import {
  APP_CONFIG,
} from '@/app/config/app.config'
import {
  closeIndexedDbConnection,
} from '@/database/indexedDbConnection'
import type {
  LibraryBackupSnapshot,
} from '@/models/dtos/LibraryBackup'
import {
  AnnotationType,
} from '@/models/enums/AnnotationType'
import {
  PageDisplayMode,
} from '@/models/enums/PageDisplayMode'
import {
  ReadingFlowMode,
} from '@/models/enums/ReadingFlowMode'
import {
  ZoomMode,
} from '@/models/enums/ZoomMode'
import type {
  AnnotationId,
} from '@/models/value-objects/AnnotationId'
import type {
  BookmarkId,
} from '@/models/value-objects/BookmarkId'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  IsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import {
  IndexedDbLibraryBackupRepository,
} from '@/repositories/indexed-db/IndexedDbLibraryBackupRepository'

const TEST_BOOK_ID =
  'livro-indexeddb-backup' as BookId

const TEST_BOOKMARK_ID =
  'favorito-indexeddb-backup' as BookmarkId

const TEST_ANNOTATION_ID =
  'anotacao-indexeddb-backup' as AnnotationId

const TEST_DATE =
  '2026-08-06T15:00:00.000Z' as IsoDateTime

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

const COVER_BYTES = [
  82,
  73,
  70,
  70,
  8,
  0,
  0,
  0,
] as const

function deleteTestDatabase():
  Promise<void> {
  closeIndexedDbConnection()

  return new Promise<void>(
    (resolve, reject) => {
      const request =
        indexedDB.deleteDatabase(
          APP_CONFIG.database.name,
        )

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(
          request.error ??
            new Error(
              'Não foi possível excluir o banco de teste.',
            ),
        )
      }

      request.onblocked = () => {
        reject(
          new Error(
            'A exclusão do banco de teste foi bloqueada.',
          ),
        )
      }
    },
  )
}

function createCompleteSnapshot():
  LibraryBackupSnapshot {
  return {
    books: [
      {
        id:
          TEST_BOOK_ID,

        title:
          'Livro persistido no IndexedDB',

        author:
          'Autor de teste',

        originalFileName:
          'livro-indexeddb-backup.pdf',

        fileSizeBytes:
          PDF_BYTES.length,

        mimeType:
          'application/pdf',

        totalPages: 12,

        pdfFingerprint:
          'fingerprint-indexeddb-backup',

        importedAt:
          TEST_DATE,

        updatedAt:
          TEST_DATE,

        lastOpenedAt:
          TEST_DATE,
      },
    ],

    bookFiles: [
      {
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
      },
    ],

    bookCovers: [
      {
        bookId:
          TEST_BOOK_ID,

        image: new Blob(
          [
            new Uint8Array(
              COVER_BYTES,
            ),
          ],
          {
            type:
              'image/webp',
          },
        ),

        mimeType:
          'image/webp',

        width: 320,
        height: 480,

        generatedAt:
          TEST_DATE,
      },
    ],

    readingProgress: [
      {
        bookId:
          TEST_BOOK_ID,

        currentPage: 7,
        pageOffsetRatio: 0.35,

        updatedAt:
          TEST_DATE,
      },
    ],

    bookmarks: [
      {
        id:
          TEST_BOOKMARK_ID,

        bookId:
          TEST_BOOK_ID,

        pageNumber: 5,
        pageOffsetRatio: 0.2,

        createdAt:
          TEST_DATE,
      },
    ],

    annotations: [
      {
        id:
          TEST_ANNOTATION_ID,

        bookId:
          TEST_BOOK_ID,

        pageNumber: 6,
        pageOffsetRatio: 0.45,

        type:
          AnnotationType.NOTE,

        content:
          'Nota persistida no IndexedDB.',

        createdAt:
          TEST_DATE,

        updatedAt:
          TEST_DATE,
      },
    ],

    readerSettings: {
      pageDisplayMode:
        PageDisplayMode.SINGLE,

      readingFlowMode:
        ReadingFlowMode.PAGINATED,

      zoomMode:
        ZoomMode.CUSTOM,

      customZoomScale: 1.25,

      enableKeyboardShortcuts:
        true,

      autoHideReaderControls:
        false,

      updatedAt:
        TEST_DATE,
    },
  }
}

function createEmptySnapshot():
  LibraryBackupSnapshot {
  return {
    books: [],
    bookFiles: [],
    bookCovers: [],
    readingProgress: [],
    bookmarks: [],
    annotations: [],
    readerSettings: null,
  }
}

describe(
  'IndexedDbLibraryBackupRepository',
  () => {
    beforeEach(
      async () => {
        await deleteTestDatabase()
      },
    )

    afterEach(
      async () => {
        await deleteTestDatabase()
      },
    )

    it(
      'persiste e recupera um snapshot completo após reabrir a conexão',
      async () => {
        const originalSnapshot =
          createCompleteSnapshot()

        const repository =
          new IndexedDbLibraryBackupRepository()

        await repository
          .replaceLibraryWithSnapshot(
            originalSnapshot,
          )

        closeIndexedDbConnection()

        const reopenedRepository =
          new IndexedDbLibraryBackupRepository()

        const restoredSnapshot =
          await reopenedRepository
            .createSnapshot()

        expect(
          restoredSnapshot.books,
        ).toEqual(
          originalSnapshot.books,
        )

        expect(
          restoredSnapshot.readingProgress,
        ).toEqual(
          originalSnapshot.readingProgress,
        )

        expect(
          restoredSnapshot.bookmarks,
        ).toEqual(
          originalSnapshot.bookmarks,
        )

        expect(
          restoredSnapshot.annotations,
        ).toEqual(
          originalSnapshot.annotations,
        )

        expect(
          restoredSnapshot.readerSettings,
        ).toEqual(
          originalSnapshot.readerSettings,
        )

        const restoredBookFile =
          restoredSnapshot.bookFiles[0]

        expect(
          restoredBookFile,
        ).toBeDefined()

        if (
          restoredBookFile === undefined
        ) {
          throw new Error(
            'O PDF persistido não foi recuperado.',
          )
        }

        expect(
          restoredBookFile.bookId,
        ).toBe(
          TEST_BOOK_ID,
        )

        expect(
          restoredBookFile.storedAt,
        ).toBe(
          TEST_DATE,
        )

        expect(
          restoredBookFile.file.type,
        ).toBe(
          'application/pdf',
        )

        expect(
          [
            ...new Uint8Array(
              await restoredBookFile
                .file
                .arrayBuffer(),
            ),
          ],
        ).toEqual(
          [...PDF_BYTES],
        )

        const restoredBookCover =
          restoredSnapshot.bookCovers[0]

        expect(
          restoredBookCover,
        ).toBeDefined()

        if (
          restoredBookCover === undefined
        ) {
          throw new Error(
            'A capa persistida não foi recuperada.',
          )
        }

        expect(
          restoredBookCover.bookId,
        ).toBe(
          TEST_BOOK_ID,
        )

        expect(
          restoredBookCover.mimeType,
        ).toBe(
          'image/webp',
        )

        expect(
          restoredBookCover.width,
        ).toBe(320)

        expect(
          restoredBookCover.height,
        ).toBe(480)

        expect(
          [
            ...new Uint8Array(
              await restoredBookCover
                .image
                .arrayBuffer(),
            ),
          ],
        ).toEqual(
          [...COVER_BYTES],
        )
      },
    )

    it(
      'remove os registros anteriores ao substituir por um snapshot vazio',
      async () => {
        const repository =
          new IndexedDbLibraryBackupRepository()

        await repository
          .replaceLibraryWithSnapshot(
            createCompleteSnapshot(),
          )

        const emptySnapshot =
          createEmptySnapshot()

        await repository
          .replaceLibraryWithSnapshot(
            emptySnapshot,
          )

        const restoredSnapshot =
          await repository
            .createSnapshot()

        expect(
          restoredSnapshot,
        ).toEqual(
          emptySnapshot,
        )
      },
    )
  },
)
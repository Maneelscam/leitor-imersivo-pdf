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
import {
  IndexedDbLibraryTransactionRepository,
} from '@/repositories/indexed-db/IndexedDbLibraryTransactionRepository'

const TARGET_BOOK_ID =
  'livro-para-excluir' as BookId

const PRESERVED_BOOK_ID =
  'livro-para-preservar' as BookId

const TARGET_BOOKMARK_ID_1 =
  'favorito-alvo-1' as BookmarkId

const TARGET_BOOKMARK_ID_2 =
  'favorito-alvo-2' as BookmarkId

const PRESERVED_BOOKMARK_ID =
  'favorito-preservado' as BookmarkId

const TARGET_ANNOTATION_ID_1 =
  'anotacao-alvo-1' as AnnotationId

const TARGET_ANNOTATION_ID_2 =
  'anotacao-alvo-2' as AnnotationId

const PRESERVED_ANNOTATION_ID =
  'anotacao-preservada' as AnnotationId

const TEST_DATE =
  '2026-08-06T18:00:00.000Z' as IsoDateTime

function createPdfBlob(
  marker: number,
): Blob {
  return new Blob(
    [
      new Uint8Array([
        37,
        80,
        68,
        70,
        45,
        marker,
      ]),
    ],
    {
      type:
        'application/pdf',
    },
  )
}

function createCoverBlob(
  marker: number,
): Blob {
  return new Blob(
    [
      new Uint8Array([
        82,
        73,
        70,
        70,
        marker,
      ]),
    ],
    {
      type:
        'image/webp',
    },
  )
}

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

function createLibrarySnapshot():
  LibraryBackupSnapshot {
  const targetPdf =
    createPdfBlob(1)

  const preservedPdf =
    createPdfBlob(2)

  return {
    books: [
      {
        id:
          TARGET_BOOK_ID,

        title:
          'Livro que será excluído',

        author:
          'Autor alvo',

        originalFileName:
          'livro-para-excluir.pdf',

        fileSizeBytes:
          targetPdf.size,

        mimeType:
          'application/pdf',

        totalPages: 10,

        pdfFingerprint:
          'fingerprint-livro-alvo',

        importedAt:
          TEST_DATE,

        updatedAt:
          TEST_DATE,

        lastOpenedAt:
          TEST_DATE,
      },

      {
        id:
          PRESERVED_BOOK_ID,

        title:
          'Livro que será preservado',

        author:
          'Autor preservado',

        originalFileName:
          'livro-para-preservar.pdf',

        fileSizeBytes:
          preservedPdf.size,

        mimeType:
          'application/pdf',

        totalPages: 20,

        pdfFingerprint:
          'fingerprint-livro-preservado',

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
          TARGET_BOOK_ID,

        file:
          targetPdf,

        storedAt:
          TEST_DATE,
      },

      {
        bookId:
          PRESERVED_BOOK_ID,

        file:
          preservedPdf,

        storedAt:
          TEST_DATE,
      },
    ],

    bookCovers: [
      {
        bookId:
          TARGET_BOOK_ID,

        image:
          createCoverBlob(1),

        mimeType:
          'image/webp',

        width: 320,
        height: 480,

        generatedAt:
          TEST_DATE,
      },

      {
        bookId:
          PRESERVED_BOOK_ID,

        image:
          createCoverBlob(2),

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
          TARGET_BOOK_ID,

        currentPage: 4,
        pageOffsetRatio: 0.25,

        updatedAt:
          TEST_DATE,
      },

      {
        bookId:
          PRESERVED_BOOK_ID,

        currentPage: 8,
        pageOffsetRatio: 0.5,

        updatedAt:
          TEST_DATE,
      },
    ],

    bookmarks: [
      {
        id:
          TARGET_BOOKMARK_ID_1,

        bookId:
          TARGET_BOOK_ID,

        pageNumber: 2,
        pageOffsetRatio: 0.1,

        createdAt:
          TEST_DATE,
      },

      {
        id:
          TARGET_BOOKMARK_ID_2,

        bookId:
          TARGET_BOOK_ID,

        pageNumber: 5,
        pageOffsetRatio: 0.4,

        createdAt:
          TEST_DATE,
      },

      {
        id:
          PRESERVED_BOOKMARK_ID,

        bookId:
          PRESERVED_BOOK_ID,

        pageNumber: 7,
        pageOffsetRatio: 0.3,

        createdAt:
          TEST_DATE,
      },
    ],

    annotations: [
      {
        id:
          TARGET_ANNOTATION_ID_1,

        bookId:
          TARGET_BOOK_ID,

        pageNumber: 3,
        pageOffsetRatio: 0.2,

        type:
          AnnotationType.NOTE,

        content:
          'Primeira anotação que deve ser excluída.',

        createdAt:
          TEST_DATE,

        updatedAt:
          TEST_DATE,
      },

      {
        id:
          TARGET_ANNOTATION_ID_2,

        bookId:
          TARGET_BOOK_ID,

        pageNumber: 6,
        pageOffsetRatio: 0.6,

        type:
          AnnotationType.NOTE,

        content:
          'Segunda anotação que deve ser excluída.',

        createdAt:
          TEST_DATE,

        updatedAt:
          TEST_DATE,
      },

      {
        id:
          PRESERVED_ANNOTATION_ID,

        bookId:
          PRESERVED_BOOK_ID,

        pageNumber: 9,
        pageOffsetRatio: 0.35,

        type:
          AnnotationType.NOTE,

        content:
          'Anotação que deve permanecer.',

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

      customZoomScale: 1.2,

      enableKeyboardShortcuts:
        true,

      autoHideReaderControls:
        false,

      updatedAt:
        TEST_DATE,
    },
  }
}

describe(
  'IndexedDbLibraryTransactionRepository',
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
      'exclui completamente um livro sem remover os dados de outros livros',
      async () => {
        const originalSnapshot =
          createLibrarySnapshot()

        const backupRepository =
          new IndexedDbLibraryBackupRepository()

        const transactionRepository =
          new IndexedDbLibraryTransactionRepository()

        await backupRepository
          .replaceLibraryWithSnapshot(
            originalSnapshot,
          )

        await transactionRepository
          .deleteBookCompletely(
            TARGET_BOOK_ID,
          )

        const resultingSnapshot =
          await backupRepository
            .createSnapshot()

        expect(
          resultingSnapshot.books.map(
            (book) => book.id,
          ),
        ).toEqual([
          PRESERVED_BOOK_ID,
        ])

        expect(
          resultingSnapshot.bookFiles.map(
            (bookFile) =>
              bookFile.bookId,
          ),
        ).toEqual([
          PRESERVED_BOOK_ID,
        ])

        expect(
          resultingSnapshot.bookCovers.map(
            (bookCover) =>
              bookCover.bookId,
          ),
        ).toEqual([
          PRESERVED_BOOK_ID,
        ])

        expect(
          resultingSnapshot.readingProgress.map(
            (progress) =>
              progress.bookId,
          ),
        ).toEqual([
          PRESERVED_BOOK_ID,
        ])

        expect(
          resultingSnapshot.bookmarks.map(
            (bookmark) =>
              bookmark.id,
          ),
        ).toEqual([
          PRESERVED_BOOKMARK_ID,
        ])

        expect(
          resultingSnapshot.annotations.map(
            (annotation) =>
              annotation.id,
          ),
        ).toEqual([
          PRESERVED_ANNOTATION_ID,
        ])

        expect(
          resultingSnapshot.readerSettings,
        ).toEqual(
          originalSnapshot.readerSettings,
        )
      },
    )
  },
)
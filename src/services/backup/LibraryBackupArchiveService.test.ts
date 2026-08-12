import {
  strFromU8,
  unzipSync,
} from 'fflate'
import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  APP_CONFIG,
} from '@/app/config/app.config'
import {
  LIBRARY_BACKUP_FORMAT,
  LIBRARY_BACKUP_FORMAT_VERSION,
  LIBRARY_BACKUP_MANIFEST_FILE_NAME,
  type LibraryBackupSnapshot,
} from '@/models/dtos/LibraryBackup'
import type {
  Book,
} from '@/models/entities/Book'
import type {
  BookCover,
} from '@/models/entities/BookCover'
import type {
  BookFile,
} from '@/models/entities/BookFile'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  IsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import {
  LibraryBackupArchiveService,
} from '@/services/backup/LibraryBackupArchiveService'

const TEST_BOOK_ID =
  'livro backup/ç' as BookId

const TEST_DATE =
  '2026-08-12T12:00:00.000Z' as IsoDateTime

const PDF_BYTES =
  new Uint8Array([
    37,
    80,
    68,
    70,
    45,
    49,
    46,
    55,
  ])

const COVER_BYTES =
  new Uint8Array([
    82,
    73,
    70,
    70,
    87,
    69,
    66,
    80,
  ])

function createBook(): Book {
  return {
    id:
      TEST_BOOK_ID,

    title:
      'Livro de backup',

    author:
      'Autor de teste',

    originalFileName:
      'livro.pdf',

    fileSizeBytes:
      PDF_BYTES.byteLength,

    mimeType:
      'application/pdf',

    totalPages: 12,

    pdfFingerprint:
      'fingerprint-backup-archive',

    importedAt:
      TEST_DATE,

    updatedAt:
      TEST_DATE,

    lastOpenedAt:
      TEST_DATE,
  }
}

function createBookFile(
  file: Blob = new Blob(
    [
      PDF_BYTES,
    ],
    {
      type:
        'application/pdf',
    },
  ),
): BookFile {
  return {
    bookId:
      TEST_BOOK_ID,

    file,

    storedAt:
      TEST_DATE,
  }
}

function createBookCover(
  image: Blob = new Blob(
    [
      COVER_BYTES,
    ],
    {
      type:
        'image/webp',
    },
  ),
): BookCover {
  return {
    bookId:
      TEST_BOOK_ID,

    image,

    mimeType:
      'image/webp',

    width: 320,
    height: 480,

    generatedAt:
      TEST_DATE,
  }
}

function createSnapshot(
  overrides:
    Partial<LibraryBackupSnapshot> = {},
): LibraryBackupSnapshot {
  return {
    books: [
      createBook(),
    ],

    bookFiles: [
      createBookFile(),
    ],

    bookCovers: [
      createBookCover(),
    ],

    readingProgress: [],

    bookmarks: [],

    annotations: [],

    readerSettings: null,

    ...overrides,
  }
}

describe(
  'LibraryBackupArchiveService',
  () => {
    it(
      'cria manifesto V2 com metadados da aplicação e do banco',
      async () => {
        const snapshot =
          createSnapshot()

        const service =
          new LibraryBackupArchiveService()

        const result =
          await service.createArchive(
            snapshot,
          )

        expect(
          result.manifest.format,
        ).toBe(
          LIBRARY_BACKUP_FORMAT,
        )

        expect(
          result.manifest.formatVersion,
        ).toBe(
          LIBRARY_BACKUP_FORMAT_VERSION,
        )

        expect(
          result.manifest.application,
        ).toEqual({
          name:
            APP_CONFIG.name,

          version:
            APP_CONFIG.version,
        })

        expect(
          result.manifest.database,
        ).toEqual({
          name:
            APP_CONFIG.database.name,

          version:
            APP_CONFIG.database.version,
        })

        expect(
          result.manifest.data.books,
        ).toBe(
          snapshot.books,
        )

        expect(
          result.manifest.data.annotations,
        ).toBe(
          snapshot.annotations,
        )

        expect(
          result.manifest.data.readerSettings,
        ).toBeNull()

        expect(
          result.archive.type,
        ).toBe(
          'application/zip',
        )

        expect(
          Number.isNaN(
            Date.parse(
              result.manifest.createdAt,
            ),
          ),
        ).toBe(
          false,
        )
      },
    )

    it(
      'gera nome de arquivo seguro a partir do createdAt do manifesto',
      async () => {
        const service =
          new LibraryBackupArchiveService()

        const result =
          await service.createArchive(
            createSnapshot(),
          )

        const expectedTimestamp =
          result.manifest.createdAt.replace(
            /[:.]/g,
            '-',
          )

        expect(
          result.fileName,
        ).toBe(
          `leitor-imersivo-pdf-backup-${expectedTimestamp}.zip`,
        )
      },
    )

    it(
      'grava backup.json dentro do ZIP com o mesmo manifesto retornado',
      async () => {
        const service =
          new LibraryBackupArchiveService()

        const result =
          await service.createArchive(
            createSnapshot(),
          )

        const entries =
          unzipSync(
            new Uint8Array(
              await result.archive.arrayBuffer(),
            ),
          )

        const manifestData =
          entries[
            LIBRARY_BACKUP_MANIFEST_FILE_NAME
          ]

        expect(
          manifestData,
        ).toBeDefined()

        if (
          manifestData === undefined
        ) {
          throw new Error(
            'backup.json não foi encontrado no ZIP.',
          )
        }

        const parsedManifest =
          JSON.parse(
            strFromU8(
              manifestData,
            ),
          ) as unknown

        expect(
          parsedManifest,
        ).toEqual(
          result.manifest,
        )
      },
    )

    it(
      'preserva PDFs e capas e usa caminhos internos codificados pelo bookId',
      async () => {
        const service =
          new LibraryBackupArchiveService()

        const result =
          await service.createArchive(
            createSnapshot(),
          )

        const expectedSegment =
          encodeURIComponent(
            TEST_BOOK_ID.trim(),
          )

        const expectedPdfPath =
          `files/${expectedSegment}.pdf`

        const expectedCoverPath =
          `covers/${expectedSegment}.webp`

        expect(
          result.manifest.data.bookFiles,
        ).toEqual([
          {
            bookId:
              TEST_BOOK_ID,

            archivePath:
              expectedPdfPath,

            mimeType:
              'application/pdf',

            sizeBytes:
              PDF_BYTES.byteLength,

            storedAt:
              TEST_DATE,
          },
        ])

        expect(
          result.manifest.data.bookCovers,
        ).toEqual([
          {
            bookId:
              TEST_BOOK_ID,

            archivePath:
              expectedCoverPath,

            mimeType:
              'image/webp',

            sizeBytes:
              COVER_BYTES.byteLength,

            width: 320,
            height: 480,

            generatedAt:
              TEST_DATE,
          },
        ])

        const entries =
          unzipSync(
            new Uint8Array(
              await result.archive.arrayBuffer(),
            ),
          )

        expect(
          Array.from(
            entries[
              expectedPdfPath
            ] ?? [],
          ),
        ).toEqual(
          Array.from(
            PDF_BYTES,
          ),
        )

        expect(
          Array.from(
            entries[
              expectedCoverPath
            ] ?? [],
          ),
        ).toEqual(
          Array.from(
            COVER_BYTES,
          ),
        )
      },
    )

    it(
      'cria backup válido para biblioteca vazia',
      async () => {
        const emptySnapshot:
          LibraryBackupSnapshot = {
            books: [],
            bookFiles: [],
            bookCovers: [],
            readingProgress: [],
            bookmarks: [],
            annotations: [],
            readerSettings: null,
          }

        const service =
          new LibraryBackupArchiveService()

        const result =
          await service.createArchive(
            emptySnapshot,
          )

        expect(
          result.manifest.data,
        ).toEqual({
          books: [],
          bookFiles: [],
          bookCovers: [],
          readingProgress: [],
          bookmarks: [],
          annotations: [],
          readerSettings: null,
        })

        const entries =
          unzipSync(
            new Uint8Array(
              await result.archive.arrayBuffer(),
            ),
          )

        expect(
          Object.keys(
            entries,
          ),
        ).toEqual([
          LIBRARY_BACKUP_MANIFEST_FILE_NAME,
        ])
      },
    )

    it(
      'propaga falha ao ler um PDF antes da compactação',
      async () => {
        const readError =
          new Error(
            'falha ao ler PDF',
          )

        const brokenBlob = {
          size:
            PDF_BYTES.byteLength,

          arrayBuffer:
            async () =>
              Promise.reject(
                readError,
              ),
        } as unknown as Blob

        const service =
          new LibraryBackupArchiveService()

        await expect(
          service.createArchive(
            createSnapshot({
              bookFiles: [
                createBookFile(
                  brokenBlob,
                ),
              ],
            }),
          ),
        ).rejects.toBe(
          readError,
        )
      },
    )

    it(
      'propaga falha ao ler uma capa antes da compactação',
      async () => {
        const readError =
          new Error(
            'falha ao ler capa',
          )

        const brokenBlob = {
          size:
            COVER_BYTES.byteLength,

          arrayBuffer:
            async () =>
              Promise.reject(
                readError,
              ),
        } as unknown as Blob

        const service =
          new LibraryBackupArchiveService()

        await expect(
          service.createArchive(
            createSnapshot({
              bookCovers: [
                createBookCover(
                  brokenBlob,
                ),
              ],
            }),
          ),
        ).rejects.toBe(
          readError,
        )
      },
    )
  },
)

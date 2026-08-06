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
  LIBRARY_BACKUP_FORMAT_VERSION_V1,
  LIBRARY_BACKUP_FORMAT_VERSION_V2,
} from '@/models/dtos/LibraryBackup'
import {
  AnnotationType,
} from '@/models/enums/AnnotationType'
import {
  LibraryBackupManifestValidationService,
} from '@/services/backup/LibraryBackupManifestValidationService'

const TEST_DATE =
  '2026-08-06T12:00:00.000Z'

const TEST_BOOK_ID =
  'livro-de-teste'

function createBook() {
  return {
    id: TEST_BOOK_ID,

    title:
      'Livro de teste',

    author: null,

    originalFileName:
      'livro-de-teste.pdf',

    fileSizeBytes: 3,

    mimeType:
      'application/pdf',

    totalPages: 10,

    pdfFingerprint:
      'fingerprint-livro-de-teste',

    importedAt:
      TEST_DATE,

    updatedAt:
      TEST_DATE,

    lastOpenedAt: null,
  }
}

function createCommonManifestData() {
  return {
    books: [
      createBook(),
    ],

    bookFiles: [
      {
        bookId:
          TEST_BOOK_ID,

        archivePath:
          'files/livro-de-teste.pdf',

        mimeType:
          'application/pdf',

        sizeBytes: 3,

        storedAt:
          TEST_DATE,
      },
    ],

    bookCovers: [],

    readingProgress: [],

    bookmarks: [],

    readerSettings: null,
  }
}

function createManifest(
  formatVersion:
    | typeof LIBRARY_BACKUP_FORMAT_VERSION_V1
    | typeof LIBRARY_BACKUP_FORMAT_VERSION_V2,
  data: Record<string, unknown>,
) {
  return {
    format:
      LIBRARY_BACKUP_FORMAT,

    formatVersion,

    createdAt:
      TEST_DATE,

    application: {
      name:
        APP_CONFIG.name,

      version:
        APP_CONFIG.version,
    },

    database: {
      name:
        APP_CONFIG.database.name,

      version:
        APP_CONFIG.database.version,
    },

    data,
  }
}

describe(
  'LibraryBackupManifestValidationService',
  () => {
    const service =
      new LibraryBackupManifestValidationService()

    it(
      'normaliza backups V1 sem anotações',
      () => {
        const manifest =
          createManifest(
            LIBRARY_BACKUP_FORMAT_VERSION_V1,
            createCommonManifestData(),
          )

        const result =
          service.validate(
            manifest,
          )

        expect(
          result.formatVersion,
        ).toBe(
          LIBRARY_BACKUP_FORMAT_VERSION_V1,
        )

        expect(
          result.data.annotations,
        ).toEqual([])
      },
    )

    it(
      'preserva uma nota válida em backups V2',
      () => {
        const note = {
          id:
            'anotacao-de-teste',

          bookId:
            TEST_BOOK_ID,

          pageNumber: 2,

          pageOffsetRatio: 0.25,

          type:
            AnnotationType.NOTE,

          content:
            'Nota restaurada pelo backup.',

          createdAt:
            TEST_DATE,

          updatedAt:
            TEST_DATE,
        }

        const manifest =
          createManifest(
            LIBRARY_BACKUP_FORMAT_VERSION_V2,
            {
              ...createCommonManifestData(),

              annotations: [
                note,
              ],
            },
          )

        const result =
          service.validate(
            manifest,
          )

        expect(
          result.data.annotations,
        ).toEqual([
          note,
        ])
      },
    )

    it(
      'rejeita backups V2 sem a coleção de anotações',
      () => {
        const manifest =
          createManifest(
            LIBRARY_BACKUP_FORMAT_VERSION_V2,
            createCommonManifestData(),
          )

        expect(
          () =>
            service.validate(
              manifest,
            ),
        ).toThrow(
          'O arquivo backup.json está ausente, corrompido ou possui uma estrutura inválida.',
        )
      },
    )

    it(
      'rejeita notas com conteúdo vazio',
      () => {
        const manifest =
          createManifest(
            LIBRARY_BACKUP_FORMAT_VERSION_V2,
            {
              ...createCommonManifestData(),

              annotations: [
                {
                  id:
                    'anotacao-vazia',

                  bookId:
                    TEST_BOOK_ID,

                  pageNumber: 2,

                  pageOffsetRatio: 0,

                  type:
                    AnnotationType.NOTE,

                  content: '   ',

                  createdAt:
                    TEST_DATE,

                  updatedAt:
                    TEST_DATE,
                },
              ],
            },
          )

        expect(
          () =>
            service.validate(
              manifest,
            ),
        ).toThrow(
          'O arquivo backup.json está ausente, corrompido ou possui uma estrutura inválida.',
        )
      },
    )

    it(
      'rejeita anotações que apontam para páginas inexistentes',
      () => {
        const manifest =
          createManifest(
            LIBRARY_BACKUP_FORMAT_VERSION_V2,
            {
              ...createCommonManifestData(),

              annotations: [
                {
                  id:
                    'anotacao-pagina-invalida',

                  bookId:
                    TEST_BOOK_ID,

                  pageNumber: 11,

                  pageOffsetRatio: 0,

                  type:
                    AnnotationType.NOTE,

                  content:
                    'Página inválida.',

                  createdAt:
                    TEST_DATE,

                  updatedAt:
                    TEST_DATE,
                },
              ],
            },
          )

        expect(
          () =>
            service.validate(
              manifest,
            ),
        ).toThrow(
          'Uma anotação de “Livro de teste” aponta para uma página inexistente.',
        )
      },
    )
  },
)

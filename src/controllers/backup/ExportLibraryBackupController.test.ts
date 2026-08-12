import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  ExportLibraryBackupController,
} from '@/controllers/backup/ExportLibraryBackupController'
import {
  LIBRARY_BACKUP_FORMAT,
  LIBRARY_BACKUP_FORMAT_VERSION,
  type LibraryBackupManifest,
  type LibraryBackupSnapshot,
} from '@/models/dtos/LibraryBackup'
import type {
  LibraryBackupRepository,
} from '@/repositories/contracts/LibraryBackupRepository'
import type {
  LibraryBackupArchiveResult,
  LibraryBackupArchiveService,
} from '@/services/backup/LibraryBackupArchiveService'
import type {
  IsoDateTime,
} from '@/models/value-objects/IsoDateTime'

const TEST_DATE =
  '2026-08-12T12:00:00.000Z' as IsoDateTime

function createSnapshot():
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

function createManifest():
  LibraryBackupManifest {
  return {
    format:
      LIBRARY_BACKUP_FORMAT,

    formatVersion:
      LIBRARY_BACKUP_FORMAT_VERSION,

    createdAt:
      TEST_DATE,

    application: {
      name:
        'Leitor Imersivo de PDF',

      version:
        '0.1.0',
    },

    database: {
      name:
        'leitor-imersivo-pdf',

      version: 3,
    },

    data: {
      books: [],
      bookFiles: [],
      bookCovers: [],
      readingProgress: [],
      bookmarks: [],
      annotations: [],
      readerSettings: null,
    },
  }
}

describe(
  'ExportLibraryBackupController',
  () => {
    it(
      'cria snapshot no repositório e o encaminha ao serviço de arquivo',
      async () => {
        const snapshot =
          createSnapshot()

        const archiveResult:
          LibraryBackupArchiveResult = {
            fileName:
              'backup.zip',

            archive:
              new Blob(),

            manifest:
              createManifest(),
          }

        const createSnapshotMock =
          vi.fn().mockResolvedValue(
            snapshot,
          )

        const createArchiveMock =
          vi.fn().mockResolvedValue(
            archiveResult,
          )

        const repository = {
          createSnapshot:
            createSnapshotMock,
        } as unknown as LibraryBackupRepository

        const archiveService = {
          createArchive:
            createArchiveMock,
        } as unknown as LibraryBackupArchiveService

        const controller =
          new ExportLibraryBackupController(
            repository,
            archiveService,
          )

        await expect(
          controller.execute(),
        ).resolves.toBe(
          archiveResult,
        )

        expect(
          createSnapshotMock,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          createArchiveMock,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          createArchiveMock,
        ).toHaveBeenCalledWith(
          snapshot,
        )

        expect(
          createSnapshotMock.mock.invocationCallOrder[0],
        ).toBeLessThan(
          createArchiveMock.mock.invocationCallOrder[0] ?? 0,
        )
      },
    )

    it(
      'não tenta criar o ZIP quando a criação do snapshot falha',
      async () => {
        const snapshotError =
          new Error(
            'falha no snapshot',
          )

        const createSnapshotMock =
          vi.fn().mockRejectedValue(
            snapshotError,
          )

        const createArchiveMock =
          vi.fn()

        const repository = {
          createSnapshot:
            createSnapshotMock,
        } as unknown as LibraryBackupRepository

        const archiveService = {
          createArchive:
            createArchiveMock,
        } as unknown as LibraryBackupArchiveService

        const controller =
          new ExportLibraryBackupController(
            repository,
            archiveService,
          )

        await expect(
          controller.execute(),
        ).rejects.toBe(
          snapshotError,
        )

        expect(
          createArchiveMock,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'propaga falha do serviço responsável por criar o ZIP',
      async () => {
        const snapshot =
          createSnapshot()

        const archiveError =
          new Error(
            'falha ao compactar',
          )

        const repository = {
          createSnapshot:
            vi.fn().mockResolvedValue(
              snapshot,
            ),
        } as unknown as LibraryBackupRepository

        const archiveService = {
          createArchive:
            vi.fn().mockRejectedValue(
              archiveError,
            ),
        } as unknown as LibraryBackupArchiveService

        const controller =
          new ExportLibraryBackupController(
            repository,
            archiveService,
          )

        await expect(
          controller.execute(),
        ).rejects.toBe(
          archiveError,
        )
      },
    )
  },
)

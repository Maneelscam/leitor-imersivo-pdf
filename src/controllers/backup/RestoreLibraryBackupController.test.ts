import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  RestoreLibraryBackupController,
} from '@/controllers/backup/RestoreLibraryBackupController'
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
  LibraryBackupRestorePreparation,
  LibraryBackupRestoreService,
} from '@/services/backup/LibraryBackupRestoreService'
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
  'RestoreLibraryBackupController',
  () => {
    it(
      'prepara a restauração, substitui a biblioteca e retorna o manifesto',
      async () => {
        const archiveFile =
          new File(
            [
              new ArrayBuffer(
                1,
              ),
            ],
            'backup.zip',
          )

        const preparation:
          LibraryBackupRestorePreparation = {
            manifest:
              createManifest(),

            snapshot:
              createSnapshot(),
          }

        const prepareRestoreMock =
          vi.fn().mockResolvedValue(
            preparation,
          )

        const replaceMock =
          vi.fn().mockResolvedValue(
            undefined,
          )

        const repository = {
          replaceLibraryWithSnapshot:
            replaceMock,
        } as unknown as LibraryBackupRepository

        const restoreService = {
          prepareRestore:
            prepareRestoreMock,
        } as unknown as LibraryBackupRestoreService

        const controller =
          new RestoreLibraryBackupController(
            repository,
            restoreService,
          )

        const result =
          await controller.execute({
            archiveFile,
          })

        expect(
          prepareRestoreMock,
        ).toHaveBeenCalledWith(
          archiveFile,
        )

        expect(
          replaceMock,
        ).toHaveBeenCalledWith(
          preparation.snapshot,
        )

        expect(
          prepareRestoreMock.mock.invocationCallOrder[0],
        ).toBeLessThan(
          replaceMock.mock.invocationCallOrder[0] ?? 0,
        )

        expect(
          result,
        ).toEqual({
          manifest:
            preparation.manifest,
        })
      },
    )

    it(
      'não substitui a biblioteca quando a preparação falha',
      async () => {
        const prepareError =
          new Error(
            'backup inválido',
          )

        const replaceMock =
          vi.fn()

        const repository = {
          replaceLibraryWithSnapshot:
            replaceMock,
        } as unknown as LibraryBackupRepository

        const restoreService = {
          prepareRestore:
            vi.fn().mockRejectedValue(
              prepareError,
            ),
        } as unknown as LibraryBackupRestoreService

        const controller =
          new RestoreLibraryBackupController(
            repository,
            restoreService,
          )

        await expect(
          controller.execute({
            archiveFile:
              new File(
                [
                  new ArrayBuffer(
                    1,
                  ),
                ],
                'backup.zip',
              ),
          }),
        ).rejects.toBe(
          prepareError,
        )

        expect(
          replaceMock,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'propaga falha ao substituir a biblioteca pelo snapshot',
      async () => {
        const replaceError =
          new Error(
            'falha ao substituir biblioteca',
          )

        const preparation:
          LibraryBackupRestorePreparation = {
            manifest:
              createManifest(),

            snapshot:
              createSnapshot(),
          }

        const repository = {
          replaceLibraryWithSnapshot:
            vi.fn().mockRejectedValue(
              replaceError,
            ),
        } as unknown as LibraryBackupRepository

        const restoreService = {
          prepareRestore:
            vi.fn().mockResolvedValue(
              preparation,
            ),
        } as unknown as LibraryBackupRestoreService

        const controller =
          new RestoreLibraryBackupController(
            repository,
            restoreService,
          )

        await expect(
          controller.execute({
            archiveFile:
              new File(
                [
                  new ArrayBuffer(
                    1,
                  ),
                ],
                'backup.zip',
              ),
          }),
        ).rejects.toBe(
          replaceError,
        )
      },
    )
  },
)

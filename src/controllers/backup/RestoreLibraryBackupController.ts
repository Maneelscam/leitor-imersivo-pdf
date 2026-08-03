import type {
  LibraryBackupManifest,
} from '@/models/dtos/LibraryBackup'
import type {
  LibraryBackupRepository,
} from '@/repositories/contracts/LibraryBackupRepository'
import type {
  LibraryBackupRestoreService,
} from '@/services/backup/LibraryBackupRestoreService'

export interface RestoreLibraryBackupCommand {
  readonly archiveFile: File
}

export interface RestoreLibraryBackupResult {
  readonly manifest:
    LibraryBackupManifest
}

export class RestoreLibraryBackupController {
  constructor(
    private readonly libraryBackupRepository:
      LibraryBackupRepository,

    private readonly libraryBackupRestoreService:
      LibraryBackupRestoreService,
  ) {}

  async execute(
    command: RestoreLibraryBackupCommand,
  ): Promise<RestoreLibraryBackupResult> {
    const preparation =
      await this.libraryBackupRestoreService.prepareRestore(
        command.archiveFile,
      )

    await this.libraryBackupRepository
      .replaceLibraryWithSnapshot(
        preparation.snapshot,
      )

    return {
      manifest:
        preparation.manifest,
    }
  }
}
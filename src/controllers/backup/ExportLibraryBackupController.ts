import type {
  LibraryBackupRepository,
} from '@/repositories/contracts/LibraryBackupRepository'
import type {
  LibraryBackupArchiveResult,
  LibraryBackupArchiveService,
} from '@/services/backup/LibraryBackupArchiveService'

export class ExportLibraryBackupController {
  constructor(
    private readonly libraryBackupRepository:
      LibraryBackupRepository,

    private readonly libraryBackupArchiveService:
      LibraryBackupArchiveService,
  ) {}

  async execute():
    Promise<LibraryBackupArchiveResult> {
    const snapshot =
      await this.libraryBackupRepository.createSnapshot()

    return this.libraryBackupArchiveService.createArchive(
      snapshot,
    )
  }
}
import type {
  LibraryBackupSnapshot,
} from '@/models/dtos/LibraryBackup'

export interface LibraryBackupRepository {
  createSnapshot(): Promise<LibraryBackupSnapshot>

  replaceLibraryWithSnapshot(
    snapshot: LibraryBackupSnapshot,
  ): Promise<void>
}
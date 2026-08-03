import type { AppStore } from '@/stores/appStore.types'

export const selectLibraryBackupExportStatus = (
  state: AppStore,
) => state.libraryBackupExportStatus

export const selectLibraryBackupRestoreStatus = (
  state: AppStore,
) => state.libraryBackupRestoreStatus

export const selectLibraryBackupErrorMessage = (
  state: AppStore,
) => state.libraryBackupErrorMessage

export const selectExportLibraryBackup = (
  state: AppStore,
) => state.exportLibraryBackup

export const selectRestoreLibraryBackup = (
  state: AppStore,
) => state.restoreLibraryBackup

export const selectClearLibraryBackupError = (
  state: AppStore,
) => state.clearLibraryBackupError

export const selectResetLibraryBackupRestoreStatus = (
  state: AppStore,
) => state.resetLibraryBackupRestoreStatus
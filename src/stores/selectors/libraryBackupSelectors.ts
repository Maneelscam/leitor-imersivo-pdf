import type { AppStore } from '@/stores/appStore.types'

export const selectLibraryBackupExportStatus = (
  state: AppStore,
) => state.libraryBackupExportStatus

export const selectLibraryBackupErrorMessage = (
  state: AppStore,
) => state.libraryBackupErrorMessage

export const selectExportLibraryBackup = (
  state: AppStore,
) => state.exportLibraryBackup

export const selectClearLibraryBackupError = (
  state: AppStore,
) => state.clearLibraryBackupError
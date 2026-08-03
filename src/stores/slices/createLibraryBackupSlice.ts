import type { StateCreator } from 'zustand'

import { applicationContainer } from '@/app/providers/applicationContainer'
import { AsyncStatus } from '@/models/enums/AsyncStatus'
import type {
  AppStore,
  LibraryBackupSlice,
} from '@/stores/appStore.types'
import { getErrorMessage } from '@/utils/errors/getErrorMessage'
import { downloadBlob } from '@/utils/files/downloadBlob'

type LibraryBackupSliceCreator = StateCreator<
  AppStore,
  [],
  [],
  LibraryBackupSlice
>

function isBackupOperationRunning(
  state: AppStore,
): boolean {
  return (
    state.libraryBackupExportStatus ===
      AsyncStatus.LOADING ||
    state.libraryBackupRestoreStatus ===
      AsyncStatus.LOADING
  )
}

export const createLibraryBackupSlice:
  LibraryBackupSliceCreator = (
    set,
    get,
  ) => ({
    libraryBackupExportStatus:
      AsyncStatus.IDLE,

    libraryBackupRestoreStatus:
      AsyncStatus.IDLE,

    libraryBackupErrorMessage: null,

    exportLibraryBackup: async () => {
      if (
        isBackupOperationRunning(
          get(),
        )
      ) {
        return
      }

      set({
        libraryBackupExportStatus:
          AsyncStatus.LOADING,

        libraryBackupErrorMessage: null,
      })

      try {
        const result =
          await applicationContainer.controllers
            .exportLibraryBackup
            .execute()

        downloadBlob(
          result.archive,
          result.fileName,
        )

        set({
          libraryBackupExportStatus:
            AsyncStatus.SUCCESS,
        })
      } catch (error) {
        set({
          libraryBackupExportStatus:
            AsyncStatus.ERROR,

          libraryBackupErrorMessage:
            getErrorMessage(
              error,
              'Não foi possível exportar o backup da biblioteca.',
            ),
        })
      }
    },

    restoreLibraryBackup: async (
      archiveFile,
    ) => {
      if (
        isBackupOperationRunning(
          get(),
        )
      ) {
        return
      }

      set({
        libraryBackupRestoreStatus:
          AsyncStatus.LOADING,

        libraryBackupErrorMessage: null,
      })

      try {
        if (
          get().openedBook !== null
        ) {
          await get().closeBook()
        }

        await applicationContainer.controllers
          .restoreLibraryBackup
          .execute({
            archiveFile,
          })

        await Promise.all([
          get().loadLibrary(),
          get().loadReaderSettings(),
        ])

        set({
          libraryBackupRestoreStatus:
            AsyncStatus.SUCCESS,
        })
      } catch (error) {
        set({
          libraryBackupRestoreStatus:
            AsyncStatus.ERROR,

          libraryBackupErrorMessage:
            getErrorMessage(
              error,
              'Não foi possível restaurar o backup da biblioteca.',
            ),
        })
      }
    },

    clearLibraryBackupError: () => {
      set({
        libraryBackupErrorMessage: null,
      })
    },

    resetLibraryBackupRestoreStatus: () => {
      set({
        libraryBackupRestoreStatus:
          AsyncStatus.IDLE,
      })
    },
  })
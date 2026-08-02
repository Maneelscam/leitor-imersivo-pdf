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

export const createLibraryBackupSlice:
  LibraryBackupSliceCreator = (
    set,
    get,
  ) => ({
    libraryBackupExportStatus:
      AsyncStatus.IDLE,

    libraryBackupErrorMessage: null,

    exportLibraryBackup: async () => {
      if (
        get().libraryBackupExportStatus ===
        AsyncStatus.LOADING
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

    clearLibraryBackupError: () => {
      set({
        libraryBackupErrorMessage: null,
      })
    },
  })
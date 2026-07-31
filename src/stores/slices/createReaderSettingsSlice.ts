import type { StateCreator } from 'zustand'

import { applicationContainer } from '@/app/providers/applicationContainer'
import { AsyncStatus } from '@/models/enums/AsyncStatus'
import type {
  AppStore,
  ReaderSettingsSlice,
} from '@/stores/appStore.types'
import { getErrorMessage } from '@/utils/errors/getErrorMessage'

type ReaderSettingsSliceCreator = StateCreator<
  AppStore,
  [],
  [],
  ReaderSettingsSlice
>

export const createReaderSettingsSlice:
  ReaderSettingsSliceCreator = (set) => {
    let settingsOperationSequence = 0

    return {
      readerSettings: null,

      readerSettingsLoadStatus: AsyncStatus.IDLE,
      readerSettingsSaveStatus: AsyncStatus.IDLE,

      readerSettingsErrorMessage: null,

      loadReaderSettings: async () => {
        const operationId = ++settingsOperationSequence

        set({
          readerSettingsLoadStatus: AsyncStatus.LOADING,
          readerSettingsErrorMessage: null,
        })

        try {
          const readerSettings =
            await applicationContainer.controllers
              .loadReaderSettings.execute()

          if (operationId !== settingsOperationSequence) {
            return
          }

          set({
            readerSettings,
            readerSettingsLoadStatus: AsyncStatus.SUCCESS,
          })
        } catch (error) {
          if (operationId !== settingsOperationSequence) {
            return
          }

          set({
            readerSettingsLoadStatus: AsyncStatus.ERROR,
            readerSettingsErrorMessage: getErrorMessage(
              error,
              'Não foi possível carregar as configurações do leitor.',
            ),
          })
        }
      },

      saveReaderSettings: async (command) => {
        const operationId = ++settingsOperationSequence

        set({
          readerSettingsSaveStatus: AsyncStatus.LOADING,
          readerSettingsErrorMessage: null,
        })

        try {
          const readerSettings =
            await applicationContainer.controllers
              .saveReaderSettings.execute(command)

          if (operationId !== settingsOperationSequence) {
            return
          }

          set({
            readerSettings,
            readerSettingsSaveStatus: AsyncStatus.SUCCESS,
          })
        } catch (error) {
          if (operationId !== settingsOperationSequence) {
            return
          }

          set({
            readerSettingsSaveStatus: AsyncStatus.ERROR,
            readerSettingsErrorMessage: getErrorMessage(
              error,
              'Não foi possível salvar as configurações do leitor.',
            ),
          })
        }
      },

      resetReaderSettings: async () => {
        const operationId = ++settingsOperationSequence

        set({
          readerSettingsSaveStatus: AsyncStatus.LOADING,
          readerSettingsErrorMessage: null,
        })

        try {
          const readerSettings =
            await applicationContainer.controllers
              .resetReaderSettings.execute()

          if (operationId !== settingsOperationSequence) {
            return
          }

          set({
            readerSettings,
            readerSettingsSaveStatus: AsyncStatus.SUCCESS,
          })
        } catch (error) {
          if (operationId !== settingsOperationSequence) {
            return
          }

          set({
            readerSettingsSaveStatus: AsyncStatus.ERROR,
            readerSettingsErrorMessage: getErrorMessage(
              error,
              'Não foi possível restaurar as configurações padrão.',
            ),
          })
        }
      },

      clearReaderSettingsError: () => {
        set({
          readerSettingsErrorMessage: null,
        })
      },
    }
  }
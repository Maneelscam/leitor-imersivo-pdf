import type { AppStore } from '@/stores/appStore.types'

export const selectReaderSettings = (
  state: AppStore,
) => state.readerSettings

export const selectReaderSettingsLoadStatus = (
  state: AppStore,
) => state.readerSettingsLoadStatus

export const selectReaderSettingsSaveStatus = (
  state: AppStore,
) => state.readerSettingsSaveStatus

export const selectReaderSettingsErrorMessage = (
  state: AppStore,
) => state.readerSettingsErrorMessage

export const selectLoadReaderSettings = (
  state: AppStore,
) => state.loadReaderSettings

export const selectSaveReaderSettings = (
  state: AppStore,
) => state.saveReaderSettings

export const selectResetReaderSettings = (
  state: AppStore,
) => state.resetReaderSettings

export const selectClearReaderSettingsError = (
  state: AppStore,
) => state.clearReaderSettingsError
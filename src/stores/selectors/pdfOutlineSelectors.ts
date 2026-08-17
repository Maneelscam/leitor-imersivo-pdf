import type {
  AppStore,
} from '@/stores/appStore.types'

export const selectPdfOutlineItems = (
  state: AppStore,
) => state.pdfOutlineItems

export const selectPdfOutlineStatus = (
  state: AppStore,
) => state.pdfOutlineStatus

export const selectPdfOutlineErrorMessage = (
  state: AppStore,
) => state.pdfOutlineErrorMessage

export const selectLoadPdfOutline = (
  state: AppStore,
) => state.loadPdfOutline

export const selectClearPdfOutline = (
  state: AppStore,
) => state.clearPdfOutline

export const selectClearPdfOutlineError = (
  state: AppStore,
) => state.clearPdfOutlineError
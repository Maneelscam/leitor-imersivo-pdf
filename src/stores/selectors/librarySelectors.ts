import type { AppStore } from '@/stores/appStore.types'

export const selectLibraryItems = (
  state: AppStore,
) => state.libraryItems

export const selectLibrarySortMode = (
  state: AppStore,
) => state.librarySortMode

export const selectLibraryLoadStatus = (
  state: AppStore,
) => state.libraryLoadStatus

export const selectPdfImportStatus = (
  state: AppStore,
) => state.pdfImportStatus

export const selectBookDeleteStatus = (
  state: AppStore,
) => state.bookDeleteStatus

export const selectLibraryErrorMessage = (
  state: AppStore,
) => state.libraryErrorMessage

export const selectLastImportWarnings = (
  state: AppStore,
) => state.lastImportWarnings

export const selectLoadLibrary = (
  state: AppStore,
) => state.loadLibrary

export const selectSetLibrarySortMode = (
  state: AppStore,
) => state.setLibrarySortMode

export const selectImportPdf = (
  state: AppStore,
) => state.importPdf

export const selectDeleteBook = (
  state: AppStore,
) => state.deleteBook

export const selectClearLibraryError = (
  state: AppStore,
) => state.clearLibraryError

export const selectClearImportWarnings = (
  state: AppStore,
) => state.clearImportWarnings
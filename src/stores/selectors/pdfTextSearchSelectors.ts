import type { AppStore } from '@/stores/appStore.types'

export const selectPdfTextSearchQuery = (
  state: AppStore,
) => state.pdfTextSearchQuery

export const selectPdfTextSearchResult = (
  state: AppStore,
) => state.pdfTextSearchResult

export const selectPdfTextSearchStatus = (
  state: AppStore,
) => state.pdfTextSearchStatus

export const selectPdfTextSearchCompletedPages = (
  state: AppStore,
) => state.pdfTextSearchCompletedPages

export const selectPdfTextSearchTotalPages = (
  state: AppStore,
) => state.pdfTextSearchTotalPages

export const selectPdfTextSearchErrorMessage = (
  state: AppStore,
) => state.pdfTextSearchErrorMessage

export const selectSearchPdfText = (
  state: AppStore,
) => state.searchPdfText

export const selectClearPdfTextSearch = (
  state: AppStore,
) => state.clearPdfTextSearch

export const selectClearPdfTextSearchError = (
  state: AppStore,
) => state.clearPdfTextSearchError
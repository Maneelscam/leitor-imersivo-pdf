import type { AppStore } from '@/stores/appStore.types'

export const selectOpenedBook = (
  state: AppStore,
) => state.openedBook

export const selectLoadedPdfDocument = (
  state: AppStore,
) => state.loadedPdfDocument

export const selectLoadedPdfPage = (
  state: AppStore,
) => state.loadedPdfPage

export const selectLoadedSecondaryPdfPage = (
  state: AppStore,
) => state.loadedSecondaryPdfPage

export const selectLoadedContinuousPdfPages = (
  state: AppStore,
) => state.loadedContinuousPdfPages

export const selectContinuousPagesStartPage = (
  state: AppStore,
) => state.continuousPagesStartPage

export const selectContinuousPagesEndPage = (
  state: AppStore,
) => state.continuousPagesEndPage

export const selectContinuousHasPreviousPages = (
  state: AppStore,
) => state.continuousHasPreviousPages

export const selectContinuousHasNextPages = (
  state: AppStore,
) => state.continuousHasNextPages

export const selectLoadedThumbnailPdfPages = (
  state: AppStore,
) => state.loadedThumbnailPdfPages

export const selectThumbnailPagesStartPage = (
  state: AppStore,
) => state.thumbnailPagesStartPage

export const selectThumbnailPagesEndPage = (
  state: AppStore,
) => state.thumbnailPagesEndPage

export const selectThumbnailHasPreviousPages = (
  state: AppStore,
) => state.thumbnailHasPreviousPages

export const selectThumbnailHasNextPages = (
  state: AppStore,
) => state.thumbnailHasNextPages

export const selectBookmarks = (
  state: AppStore,
) => state.bookmarks

export const selectCurrentPage = (
  state: AppStore,
) => state.currentPage

export const selectPageOffsetRatio = (
  state: AppStore,
) => state.pageOffsetRatio

export const selectReaderOpenStatus = (
  state: AppStore,
) => state.readerOpenStatus

export const selectPageLoadStatus = (
  state: AppStore,
) => state.pageLoadStatus

export const selectSecondaryPageLoadStatus = (
  state: AppStore,
) => state.secondaryPageLoadStatus

export const selectContinuousPagesLoadStatus = (
  state: AppStore,
) => state.continuousPagesLoadStatus

export const selectThumbnailPagesLoadStatus = (
  state: AppStore,
) => state.thumbnailPagesLoadStatus

export const selectProgressSaveStatus = (
  state: AppStore,
) => state.progressSaveStatus

export const selectBookmarksLoadStatus = (
  state: AppStore,
) => state.bookmarksLoadStatus

export const selectBookmarkMutationStatus = (
  state: AppStore,
) => state.bookmarkMutationStatus

export const selectReaderErrorMessage = (
  state: AppStore,
) => state.readerErrorMessage

export const selectPageLoadErrorMessage = (
  state: AppStore,
) => state.pageLoadErrorMessage

export const selectSecondaryPageLoadErrorMessage = (
  state: AppStore,
) => state.secondaryPageLoadErrorMessage

export const selectContinuousPagesLoadErrorMessage = (
  state: AppStore,
) => state.continuousPagesLoadErrorMessage

export const selectThumbnailPagesLoadErrorMessage = (
  state: AppStore,
) => state.thumbnailPagesLoadErrorMessage

export const selectBookmarkErrorMessage = (
  state: AppStore,
) => state.bookmarkErrorMessage

export const selectOpenBook = (
  state: AppStore,
) => state.openBook

export const selectCloseBook = (
  state: AppStore,
) => state.closeBook

export const selectLoadPdfPage = (
  state: AppStore,
) => state.loadPdfPage

export const selectLoadSecondaryPdfPage = (
  state: AppStore,
) => state.loadSecondaryPdfPage

export const selectClearSecondaryPdfPage = (
  state: AppStore,
) => state.clearSecondaryPdfPage

export const selectLoadInitialContinuousPdfPages = (
  state: AppStore,
) => state.loadInitialContinuousPdfPages

export const selectLoadPreviousContinuousPdfPages = (
  state: AppStore,
) => state.loadPreviousContinuousPdfPages

export const selectLoadNextContinuousPdfPages = (
  state: AppStore,
) => state.loadNextContinuousPdfPages

export const selectClearContinuousPdfPages = (
  state: AppStore,
) => state.clearContinuousPdfPages

export const selectLoadInitialThumbnailPdfPages = (
  state: AppStore,
) => state.loadInitialThumbnailPdfPages

export const selectLoadPreviousThumbnailPdfPages = (
  state: AppStore,
) => state.loadPreviousThumbnailPdfPages

export const selectLoadNextThumbnailPdfPages = (
  state: AppStore,
) => state.loadNextThumbnailPdfPages

export const selectClearThumbnailPdfPages = (
  state: AppStore,
) => state.clearThumbnailPdfPages

export const selectSetReadingPosition = (
  state: AppStore,
) => state.setReadingPosition

export const selectSaveReadingProgress = (
  state: AppStore,
) => state.saveReadingProgress

export const selectLoadBookmarks = (
  state: AppStore,
) => state.loadBookmarks

export const selectCreateCurrentPageBookmark = (
  state: AppStore,
) => state.createCurrentPageBookmark

export const selectDeleteBookmark = (
  state: AppStore,
) => state.deleteBookmark

export const selectClearReaderError = (
  state: AppStore,
) => state.clearReaderError

export const selectClearPageLoadError = (
  state: AppStore,
) => state.clearPageLoadError

export const selectClearSecondaryPageLoadError = (
  state: AppStore,
) => state.clearSecondaryPageLoadError

export const selectClearContinuousPagesLoadError = (
  state: AppStore,
) => state.clearContinuousPagesLoadError

export const selectClearThumbnailPagesLoadError = (
  state: AppStore,
) => state.clearThumbnailPagesLoadError

export const selectClearBookmarkError = (
  state: AppStore,
) => state.clearBookmarkError
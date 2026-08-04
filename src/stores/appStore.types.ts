import type {
  PDFPageProxy,
} from 'pdfjs-dist'

import type {
  SaveReaderSettingsCommand,
} from '@/controllers/settings/SaveReaderSettingsController'
import type {
  LibraryBookItem,
} from '@/models/dtos/LibraryBookItem'
import type {
  OpenBookResult,
} from '@/models/dtos/OpenBookResult'
import type {
  PdfImportWarningCode,
} from '@/models/dtos/PdfImportResult'
import type {
  PdfTextSearchResult,
} from '@/models/dtos/PdfTextSearchResult'
import type {
  Bookmark,
} from '@/models/entities/Bookmark'
import type {
  ReaderSettings,
} from '@/models/entities/ReaderSettings'
import type {
  AsyncStatus,
} from '@/models/enums/AsyncStatus'
import type {
  LibrarySortMode,
} from '@/models/enums/LibrarySortMode'
import type {
  BookmarkId,
} from '@/models/value-objects/BookmarkId'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  LoadedPdfDocument,
} from '@/services/pdf/PdfDocumentService'

export interface LibrarySlice {
  readonly libraryItems:
    readonly LibraryBookItem[]

  readonly librarySortMode:
    LibrarySortMode

  readonly libraryLoadStatus:
    AsyncStatus

  readonly pdfImportStatus:
    AsyncStatus

  readonly bookDeleteStatus:
    AsyncStatus

  readonly libraryErrorMessage:
    string | null

  readonly lastImportWarnings:
    readonly PdfImportWarningCode[]

  loadLibrary(
    sortMode?: LibrarySortMode,
  ): Promise<void>

  setLibrarySortMode(
    sortMode: LibrarySortMode,
  ): Promise<void>

  importPdf(
    file: File,
    password?: string,
  ): Promise<void>

  deleteBook(
    bookId: BookId,
  ): Promise<void>

  clearLibraryError(): void

  clearImportWarnings(): void
}

export interface LibraryBackupSlice {
  readonly libraryBackupExportStatus:
    AsyncStatus

  readonly libraryBackupRestoreStatus:
    AsyncStatus

  readonly libraryBackupErrorMessage:
    string | null

  exportLibraryBackup(): Promise<void>

  restoreLibraryBackup(
    archiveFile: File,
  ): Promise<void>

  clearLibraryBackupError(): void

  resetLibraryBackupRestoreStatus(): void
}

export interface ReaderSlice {
  readonly openedBook:
    OpenBookResult | null

  readonly loadedPdfDocument:
    LoadedPdfDocument | null

  readonly loadedPdfPage:
    PDFPageProxy | null

  readonly loadedSecondaryPdfPage:
    PDFPageProxy | null

  readonly loadedContinuousPdfPages:
    readonly PDFPageProxy[]

  readonly continuousPagesStartPage:
    number | null

  readonly continuousPagesEndPage:
    number | null

  readonly continuousHasPreviousPages:
    boolean

  readonly continuousHasNextPages:
    boolean

  readonly bookmarks:
    readonly Bookmark[]

  readonly currentPage: number

  readonly pageOffsetRatio: number

  readonly readerOpenStatus:
    AsyncStatus

  readonly pageLoadStatus:
    AsyncStatus

  readonly secondaryPageLoadStatus:
    AsyncStatus

  readonly continuousPagesLoadStatus:
    AsyncStatus

  readonly progressSaveStatus:
    AsyncStatus

  readonly bookmarksLoadStatus:
    AsyncStatus

  readonly bookmarkMutationStatus:
    AsyncStatus

  readonly readerErrorMessage:
    string | null

  readonly pageLoadErrorMessage:
    string | null

  readonly secondaryPageLoadErrorMessage:
    string | null

  readonly continuousPagesLoadErrorMessage:
    string | null

  readonly bookmarkErrorMessage:
    string | null

  openBook(
    bookId: BookId,
    password?: string,
  ): Promise<void>

  closeBook(): Promise<void>

  loadPdfPage(
    pageNumber: number,
  ): Promise<void>

  loadSecondaryPdfPage(): Promise<void>

  clearSecondaryPdfPage(): void

  loadInitialContinuousPdfPages(): Promise<void>

  loadPreviousContinuousPdfPages(): Promise<void>

  loadNextContinuousPdfPages(): Promise<void>

  clearContinuousPdfPages(): void

  setReadingPosition(
    currentPage: number,
    pageOffsetRatio: number,
  ): void

  saveReadingProgress(): Promise<void>

  loadBookmarks(): Promise<void>

  createCurrentPageBookmark(): Promise<void>

  deleteBookmark(
    bookmarkId: BookmarkId,
  ): Promise<void>

  clearReaderError(): void

  clearPageLoadError(): void

  clearSecondaryPageLoadError(): void

  clearContinuousPagesLoadError(): void

  clearBookmarkError(): void
}

export interface PdfTextSearchSlice {
  readonly pdfTextSearchQuery:
    string

  readonly pdfTextSearchResult:
    PdfTextSearchResult | null

  readonly pdfTextSearchStatus:
    AsyncStatus

  readonly pdfTextSearchCompletedPages:
    number

  readonly pdfTextSearchTotalPages:
    number

  readonly pdfTextSearchErrorMessage:
    string | null

  searchPdfText(
    query: string,
  ): Promise<void>

  clearPdfTextSearch(): void

  clearPdfTextSearchError(): void
}

export interface ReaderSettingsSlice {
  readonly readerSettings:
    ReaderSettings | null

  readonly readerSettingsLoadStatus:
    AsyncStatus

  readonly readerSettingsSaveStatus:
    AsyncStatus

  readonly readerSettingsErrorMessage:
    string | null

  loadReaderSettings(): Promise<void>

  saveReaderSettings(
    command: SaveReaderSettingsCommand,
  ): Promise<void>

  resetReaderSettings(): Promise<void>

  clearReaderSettingsError(): void
}

export type AppStore =
  LibrarySlice &
  LibraryBackupSlice &
  ReaderSlice &
  PdfTextSearchSlice &
  ReaderSettingsSlice
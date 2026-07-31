import { CreateBookmarkController } from '@/controllers/bookmarks/CreateBookmarkController'
import { DeleteBookmarkController } from '@/controllers/bookmarks/DeleteBookmarkController'
import { LoadBookmarksController } from '@/controllers/bookmarks/LoadBookmarksController'
import { DeleteBookController } from '@/controllers/library/DeleteBookController'
import { ImportPdfController } from '@/controllers/library/ImportPdfController'
import { LoadLibraryController } from '@/controllers/library/LoadLibraryController'
import { LoadPdfPageBatchController } from '@/controllers/reader/LoadPdfPageBatchController'
import { LoadPdfPageController } from '@/controllers/reader/LoadPdfPageController'
import { LoadSecondaryPdfPageController } from '@/controllers/reader/LoadSecondaryPdfPageController'
import { OpenBookController } from '@/controllers/reader/OpenBookController'
import { SaveReadingProgressController } from '@/controllers/reader/SaveReadingProgressController'
import { LoadReaderSettingsController } from '@/controllers/settings/LoadReaderSettingsController'
import { ResetReaderSettingsController } from '@/controllers/settings/ResetReaderSettingsController'
import { SaveReaderSettingsController } from '@/controllers/settings/SaveReaderSettingsController'
import { IndexedDbBookCoverRepository } from '@/repositories/indexed-db/IndexedDbBookCoverRepository'
import { IndexedDbBookFileRepository } from '@/repositories/indexed-db/IndexedDbBookFileRepository'
import { IndexedDbBookmarkRepository } from '@/repositories/indexed-db/IndexedDbBookmarkRepository'
import { IndexedDbBookRepository } from '@/repositories/indexed-db/IndexedDbBookRepository'
import { IndexedDbLibraryQueryRepository } from '@/repositories/indexed-db/IndexedDbLibraryQueryRepository'
import { IndexedDbLibraryTransactionRepository } from '@/repositories/indexed-db/IndexedDbLibraryTransactionRepository'
import { IndexedDbReaderSettingsRepository } from '@/repositories/indexed-db/IndexedDbReaderSettingsRepository'
import { IndexedDbReadingProgressRepository } from '@/repositories/indexed-db/IndexedDbReadingProgressRepository'
import { PdfCoverGenerationService } from '@/services/cover/PdfCoverGenerationService'
import { FileHashService } from '@/services/file/FileHashService'
import { PdfFileValidationService } from '@/services/file/PdfFileValidationService'
import { PdfMetadataService } from '@/services/metadata/PdfMetadataService'
import { PdfTitleResolutionService } from '@/services/metadata/PdfTitleResolutionService'
import { PdfDocumentService } from '@/services/pdf/PdfDocumentService'
import { PdfPageService } from '@/services/pdf/PdfPageService'
import { PdfWorkerService } from '@/services/pdf/PdfWorkerService'
import { DefaultReaderSettingsService } from '@/services/settings/DefaultReaderSettingsService'

const bookRepository =
  new IndexedDbBookRepository()

const bookFileRepository =
  new IndexedDbBookFileRepository()

const bookCoverRepository =
  new IndexedDbBookCoverRepository()

const bookmarkRepository =
  new IndexedDbBookmarkRepository()

const readingProgressRepository =
  new IndexedDbReadingProgressRepository()

const readerSettingsRepository =
  new IndexedDbReaderSettingsRepository()

const libraryQueryRepository =
  new IndexedDbLibraryQueryRepository()

const libraryTransactionRepository =
  new IndexedDbLibraryTransactionRepository()

const pdfWorkerService =
  new PdfWorkerService()

const pdfDocumentService =
  new PdfDocumentService(
    pdfWorkerService,
  )

const pdfPageService =
  new PdfPageService()

const pdfFileValidationService =
  new PdfFileValidationService()

const fileHashService =
  new FileHashService()

const pdfMetadataService =
  new PdfMetadataService()

const pdfTitleResolutionService =
  new PdfTitleResolutionService()

const pdfCoverGenerationService =
  new PdfCoverGenerationService()

const defaultReaderSettingsService =
  new DefaultReaderSettingsService()

const importPdfController =
  new ImportPdfController({
    fileValidationService:
      pdfFileValidationService,
    fileHashService,
    pdfDocumentService,
    pdfMetadataService,
    titleResolutionService:
      pdfTitleResolutionService,
    coverGenerationService:
      pdfCoverGenerationService,
    bookRepository,
    libraryTransactionRepository,
  })

const loadLibraryController =
  new LoadLibraryController(
    libraryQueryRepository,
  )

const deleteBookController =
  new DeleteBookController({
    bookRepository,
    libraryTransactionRepository,
  })

const openBookController =
  new OpenBookController({
    bookRepository,
    bookFileRepository,
    readingProgressRepository,
  })

const loadPdfPageController =
  new LoadPdfPageController(
    pdfPageService,
  )

const loadSecondaryPdfPageController =
  new LoadSecondaryPdfPageController(
    pdfPageService,
  )

const loadPdfPageBatchController =
  new LoadPdfPageBatchController(
    pdfPageService,
  )

const saveReadingProgressController =
  new SaveReadingProgressController({
    bookRepository,
    readingProgressRepository,
  })

const createBookmarkController =
  new CreateBookmarkController(
    bookmarkRepository,
  )

const loadBookmarksController =
  new LoadBookmarksController(
    bookmarkRepository,
  )

const deleteBookmarkController =
  new DeleteBookmarkController(
    bookmarkRepository,
  )

const loadReaderSettingsController =
  new LoadReaderSettingsController({
    readerSettingsRepository,
    defaultReaderSettingsService,
  })

const saveReaderSettingsController =
  new SaveReaderSettingsController(
    readerSettingsRepository,
  )

const resetReaderSettingsController =
  new ResetReaderSettingsController({
    readerSettingsRepository,
    defaultReaderSettingsService,
  })

export const applicationContainer = {
  controllers: {
    importPdf: importPdfController,
    loadLibrary: loadLibraryController,
    deleteBook: deleteBookController,

    openBook: openBookController,
    loadPdfPage: loadPdfPageController,
    loadSecondaryPdfPage:
      loadSecondaryPdfPageController,
    loadPdfPageBatch:
      loadPdfPageBatchController,
    saveReadingProgress:
      saveReadingProgressController,

    createBookmark:
      createBookmarkController,
    loadBookmarks:
      loadBookmarksController,
    deleteBookmark:
      deleteBookmarkController,

    loadReaderSettings:
      loadReaderSettingsController,
    saveReaderSettings:
      saveReaderSettingsController,
    resetReaderSettings:
      resetReaderSettingsController,
  },

  repositories: {
    book: bookRepository,
    bookFile: bookFileRepository,
    bookCover: bookCoverRepository,
    bookmark: bookmarkRepository,
    readingProgress:
      readingProgressRepository,
    readerSettings:
      readerSettingsRepository,
    libraryQuery:
      libraryQueryRepository,
    libraryTransaction:
      libraryTransactionRepository,
  },

  services: {
    pdfWorker: pdfWorkerService,
    pdfDocument: pdfDocumentService,
    pdfPage: pdfPageService,
    pdfFileValidation:
      pdfFileValidationService,
    fileHash: fileHashService,
    pdfMetadata: pdfMetadataService,
    pdfTitleResolution:
      pdfTitleResolutionService,
    pdfCoverGeneration:
      pdfCoverGenerationService,
    defaultReaderSettings:
      defaultReaderSettingsService,
  },
} as const

export type ApplicationContainer =
  typeof applicationContainer
import {
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from 'react'

import {
  AppRoute,
} from '@/app/routes/AppRoute'
import {
  navigateToAppRoute,
} from '@/app/routes/browserNavigation'
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@/components/buttons/Button'
import {
  EmptyState,
} from '@/components/feedback/EmptyState'
import {
  FeedbackMessage,
  FeedbackMessageVariant,
} from '@/components/feedback/FeedbackMessage'
import {
  LoadingIndicator,
  LoadingIndicatorSize,
} from '@/components/feedback/LoadingIndicator'
import {
  ConfirmDialog,
} from '@/components/overlays/ConfirmDialog'
import {
  PdfImportButton,
} from '@/features/import-pdf/components/PdfImportButton'
import {
  filterPdfFiles,
} from '@/features/import-pdf/utils/filterPdfFiles'
import {
  EditBookMetadataDialog,
} from '@/features/library/components/EditBookMetadataDialog'
import {
  LibraryGrid,
} from '@/features/library/components/LibraryGrid'
import {
  LibraryToolbar,
} from '@/features/library/components/LibraryToolbar'
import {
  filterLibraryItems,
} from '@/features/library/utils/filterLibraryItems'
import {
  filterLibraryItemsByReadingStatus,
} from '@/features/library/utils/filterLibraryItemsByReadingStatus'
import {
  getContinueReadingItems,
} from '@/features/library/utils/getContinueReadingItems'
import {
  getLibraryReadingSummary,
} from '@/features/library/utils/getLibraryReadingSummary'
import type {
  LibraryBookItem,
} from '@/models/dtos/LibraryBookItem'
import {
  PdfImportWarningCode,
  type PdfImportWarningCode as PdfImportWarningCodeValue,
} from '@/models/dtos/PdfImportResult'
import {
  AsyncStatus,
} from '@/models/enums/AsyncStatus'
import {
  LibraryReadingFilter,
  type LibraryReadingFilter as LibraryReadingFilterValue,
} from '@/models/enums/LibraryReadingFilter'
import type {
  LibraryViewMode,
} from '@/models/enums/LibraryViewMode'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import {
  libraryViewPreferenceService,
} from '@/services/settings/LibraryViewPreferenceService'
import {
  selectClearLibraryBackupError,
  selectExportLibraryBackup,
  selectLibraryBackupErrorMessage,
  selectLibraryBackupExportStatus,
  selectLibraryBackupRestoreStatus,
  selectResetLibraryBackupRestoreStatus,
  selectRestoreLibraryBackup,
} from '@/stores/selectors/libraryBackupSelectors'
import {
  selectBookDeleteStatus,
  selectBookMetadataUpdateStatus,
  selectClearImportWarnings,
  selectClearLibraryError,
  selectDeleteBook,
  selectLastImportWarnings,
  selectLibraryErrorMessage,
  selectLibraryItems,
  selectLibraryLoadStatus,
  selectLibrarySortMode,
  selectImportPdfs,
  selectLoadLibrary,
  selectPdfImportStatus,
  selectSetLibrarySortMode,
  selectUpdateBookMetadata,
} from '@/stores/selectors/librarySelectors'
import {
  selectOpenBook,
} from '@/stores/selectors/readerSelectors'
import {
  useAppStore,
} from '@/stores/useAppStore'

import '@/styles/components/library-page.css'
import '@/styles/components/library-premium-v11.css'

function LibraryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 4.5h4v15H4z" />
      <path d="M10 4.5h4v15h-4z" />
      <path d="m16.5 5.5 3.5-1 3.5 14-3.5 1z" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5" />
      <path d="M12 16.5h.01" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.3 3.8 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

function SuccessIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16.5 8.5" />
    </svg>
  )
}

function ReloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 7v5h-5" />
      <path d="M18.2 15.5A7 7 0 1 1 19 8" />
    </svg>
  )
}

function getImportWarningMessage(
  warningCode: PdfImportWarningCodeValue,
): string {
  switch (warningCode) {
    case PdfImportWarningCode.COVER_GENERATION_FAILED:
      return 'O PDF foi importado, mas não foi possível gerar sua capa.'

    case PdfImportWarningCode.DOCUMENT_CLEANUP_FAILED:
      return 'O PDF foi importado, mas alguns recursos temporários não foram liberados corretamente.'
  }
}

export function LibraryPage() {
  const libraryItems = useAppStore(
    selectLibraryItems,
  )

  const librarySortMode = useAppStore(
    selectLibrarySortMode,
  )

  const libraryLoadStatus = useAppStore(
    selectLibraryLoadStatus,
  )

  const pdfImportStatus = useAppStore(
    selectPdfImportStatus,
  )

  const bookDeleteStatus = useAppStore(
    selectBookDeleteStatus,
  )

  const bookMetadataUpdateStatus =
    useAppStore(
      selectBookMetadataUpdateStatus,
    )

  const libraryErrorMessage = useAppStore(
    selectLibraryErrorMessage,
  )

  const importWarnings = useAppStore(
    selectLastImportWarnings,
  )

  const libraryBackupExportStatus = useAppStore(
    selectLibraryBackupExportStatus,
  )

  const libraryBackupRestoreStatus = useAppStore(
    selectLibraryBackupRestoreStatus,
  )

  const libraryBackupErrorMessage = useAppStore(
    selectLibraryBackupErrorMessage,
  )

  const loadLibrary = useAppStore(
    selectLoadLibrary,
  )

  const importPdfs = useAppStore(
    selectImportPdfs,
  )

  const setLibrarySortMode = useAppStore(
    selectSetLibrarySortMode,
  )

  const openBook = useAppStore(
    selectOpenBook,
  )

  const deleteBook = useAppStore(
    selectDeleteBook,
  )

  const updateBookMetadata = useAppStore(
    selectUpdateBookMetadata,
  )

  const exportLibraryBackup = useAppStore(
    selectExportLibraryBackup,
  )

  const restoreLibraryBackup = useAppStore(
    selectRestoreLibraryBackup,
  )

  const clearLibraryError = useAppStore(
    selectClearLibraryError,
  )

  const clearImportWarnings = useAppStore(
    selectClearImportWarnings,
  )

  const clearLibraryBackupError = useAppStore(
    selectClearLibraryBackupError,
  )

  const resetLibraryBackupRestoreStatus = useAppStore(
    selectResetLibraryBackupRestoreStatus,
  )

  const [
    openingBookId,
    setOpeningBookId,
  ] = useState<BookId | null>(null)

  const [
    isPdfDragActive,
    setIsPdfDragActive,
  ] = useState(false)

  const [
    droppedInvalidFileCount,
    setDroppedInvalidFileCount,
  ] = useState<number | null>(null)

  const pdfDragDepthRef =
    useRef(0)

  const [
    deletingBookId,
    setDeletingBookId,
  ] = useState<BookId | null>(null)

  const [
    bookPendingDeletion,
    setBookPendingDeletion,
  ] = useState<LibraryBookItem | null>(null)

  const [
    bookPendingMetadataEdit,
    setBookPendingMetadataEdit,
  ] = useState<LibraryBookItem | null>(null)

  const [
    backupFilePendingRestore,
    setBackupFilePendingRestore,
  ] = useState<File | null>(null)

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('')

  const [
    readingFilter,
    setReadingFilter,
  ] = useState<LibraryReadingFilterValue>(
    LibraryReadingFilter.ALL,
  )

  const [
    libraryViewMode,
    setLibraryViewMode,
  ] = useState<LibraryViewMode>(
    () =>
      libraryViewPreferenceService.load(),
  )

  const handleLibraryViewModeChange = (
    viewMode: LibraryViewMode,
  ) => {
    setLibraryViewMode(viewMode)
    libraryViewPreferenceService.save(
      viewMode,
    )
  }

  const filteredLibraryItems =
    useMemo(
      () =>
        filterLibraryItemsByReadingStatus(
          filterLibraryItems(
            libraryItems,
            searchQuery,
          ),
          readingFilter,
        ),
      [
        libraryItems,
        searchQuery,
        readingFilter,
      ],
    )

  const continueReadingItems =
    useMemo(
      () =>
        getContinueReadingItems(
          libraryItems,
        ),
      [libraryItems],
    )

  const readingSummary =
    useMemo(
      () =>
        getLibraryReadingSummary(
          libraryItems,
        ),
      [libraryItems],
    )

  const normalizedSearchQuery =
    searchQuery.trim()

  const hasActiveSearch =
    normalizedSearchQuery.length > 0

  const hasActiveReadingFilter =
    readingFilter !==
    LibraryReadingFilter.ALL

  const hasActiveLibraryFilter =
    hasActiveSearch ||
    hasActiveReadingFilter

  const clearLibraryFilters = () => {
    setSearchQuery('')
    setReadingFilter(
      LibraryReadingFilter.ALL,
    )
  }

  const isInitialLoading =
    libraryItems.length === 0 &&
    (
      libraryLoadStatus === AsyncStatus.IDLE ||
      libraryLoadStatus === AsyncStatus.LOADING
    )

  const hasInitialLoadError =
    libraryItems.length === 0 &&
    libraryLoadStatus === AsyncStatus.ERROR

  const isImportingPdfs =
    pdfImportStatus === AsyncStatus.LOADING

  const isDeleting =
    bookDeleteStatus === AsyncStatus.LOADING

  const isUpdatingBookMetadata =
    bookMetadataUpdateStatus ===
    AsyncStatus.LOADING

  const hasBookMetadataUpdateError =
    bookMetadataUpdateStatus ===
      AsyncStatus.ERROR &&
    bookPendingMetadataEdit !== null

  const isBackupExporting =
    libraryBackupExportStatus ===
    AsyncStatus.LOADING

  const isBackupRestoring =
    libraryBackupRestoreStatus ===
    AsyncStatus.LOADING

  const hasBackupRestoreSucceeded =
    libraryBackupRestoreStatus ===
    AsyncStatus.SUCCESS

  const hasBackupRestoreError =
    libraryBackupRestoreStatus ===
    AsyncStatus.ERROR

  const handleOpenBook = async (
    bookId: BookId,
  ) => {
    if (
      openingBookId !== null ||
      isDeleting ||
      isUpdatingBookMetadata ||
      isBackupRestoring
    ) {
      return
    }

    setOpeningBookId(bookId)

    try {
      await openBook(bookId)

      const currentState =
        useAppStore.getState()

      if (
        currentState.openedBook?.book.id ===
          bookId &&
        currentState.readerOpenStatus ===
          AsyncStatus.SUCCESS
      ) {
        navigateToAppRoute(
          AppRoute.READER,
        )
      }
    } finally {
      setOpeningBookId(null)
    }
  }

  const requestBookMetadataEdit = (
    bookId: BookId,
  ) => {
    if (isUpdatingBookMetadata) {
      return
    }

    const selectedItem =
      libraryItems.find(
        (item) =>
          item.book.id === bookId,
      )

    if (
      selectedItem === undefined
    ) {
      return
    }

    clearLibraryError()

    setBookPendingMetadataEdit(
      selectedItem,
    )
  }

  const cancelBookMetadataEdit = () => {
    if (isUpdatingBookMetadata) {
      return
    }

    setBookPendingMetadataEdit(null)
    clearLibraryError()
  }

  const saveBookMetadata =
    async (
      title: string,
      author: string | null,
    ) => {
      if (
        bookPendingMetadataEdit ===
          null ||
        isUpdatingBookMetadata
      ) {
        return
      }

      await updateBookMetadata(
        bookPendingMetadataEdit
          .book.id,
        title,
        author,
      )

      const currentState =
        useAppStore.getState()

      if (
        currentState
          .bookMetadataUpdateStatus ===
        AsyncStatus.SUCCESS
      ) {
        setBookPendingMetadataEdit(
          null,
        )
      }
    }

  const requestBookDeletion = (
    bookId: BookId,
  ) => {
    if (isUpdatingBookMetadata) {
      return
    }

    const selectedItem =
      libraryItems.find(
        (item) =>
          item.book.id === bookId,
      )

    if (
      selectedItem === undefined
    ) {
      return
    }

    clearLibraryError()
    setBookPendingDeletion(
      selectedItem,
    )
  }

  const cancelBookDeletion = () => {
    if (isDeleting) {
      return
    }

    setBookPendingDeletion(null)
    setDeletingBookId(null)
    clearLibraryError()
  }

  const confirmBookDeletion =
    async () => {
      if (
        bookPendingDeletion ===
          null ||
        isDeleting
      ) {
        return
      }

      const bookId =
        bookPendingDeletion.book.id

      setDeletingBookId(bookId)
      clearLibraryError()

      try {
        await deleteBook(bookId)

        const currentState =
          useAppStore.getState()

        if (
          currentState
            .bookDeleteStatus ===
          AsyncStatus.SUCCESS
        ) {
          setBookPendingDeletion(
            null,
          )
        }
      } finally {
        setDeletingBookId(null)
      }
    }

  const requestBackupRestore = (
    archiveFile: File,
  ) => {
    if (
      isBackupExporting ||
      isBackupRestoring
    ) {
      return
    }

    clearLibraryBackupError()
    resetLibraryBackupRestoreStatus()

    setBackupFilePendingRestore(
      archiveFile,
    )
  }

  const cancelBackupRestore = () => {
    if (isBackupRestoring) {
      return
    }

    setBackupFilePendingRestore(
      null,
    )

    clearLibraryBackupError()
    resetLibraryBackupRestoreStatus()
  }

  const confirmBackupRestore =
    async () => {
      if (
        backupFilePendingRestore ===
          null ||
        isBackupRestoring
      ) {
        return
      }

      clearLibraryBackupError()
      resetLibraryBackupRestoreStatus()

      await restoreLibraryBackup(
        backupFilePendingRestore,
      )

      const currentState =
        useAppStore.getState()

      if (
        currentState
          .libraryBackupRestoreStatus ===
        AsyncStatus.SUCCESS
      ) {
        setBackupFilePendingRestore(
          null,
        )
      }
    }

  const dismissBackupRestoreSuccess =
    () => {
      resetLibraryBackupRestoreStatus()
    }

  const retryLibraryLoading = () => {
    void loadLibrary()
  }

  const canUsePdfDrop =
    !isImportingPdfs &&
    !isDeleting &&
    !isUpdatingBookMetadata &&
    !isBackupRestoring

  const hasDraggedFiles = (
    event: DragEvent<HTMLElement>,
  ): boolean =>
    Array.from(
      event.dataTransfer.types,
    ).includes('Files')

  const handlePdfDragEnter = (
    event: DragEvent<HTMLElement>,
  ) => {
    if (
      !canUsePdfDrop ||
      !hasDraggedFiles(event)
    ) {
      return
    }

    event.preventDefault()
    pdfDragDepthRef.current += 1
    setIsPdfDragActive(true)
  }

  const handlePdfDragOver = (
    event: DragEvent<HTMLElement>,
  ) => {
    if (
      !canUsePdfDrop ||
      !hasDraggedFiles(event)
    ) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  const handlePdfDragLeave = (
    event: DragEvent<HTMLElement>,
  ) => {
    if (!hasDraggedFiles(event)) {
      return
    }

    event.preventDefault()

    pdfDragDepthRef.current =
      Math.max(
        0,
        pdfDragDepthRef.current - 1,
      )

    if (pdfDragDepthRef.current === 0) {
      setIsPdfDragActive(false)
    }
  }

  const handlePdfDrop = (
    event: DragEvent<HTMLElement>,
  ) => {
    if (!hasDraggedFiles(event)) {
      return
    }

    event.preventDefault()

    pdfDragDepthRef.current = 0
    setIsPdfDragActive(false)

    if (!canUsePdfDrop) {
      return
    }

    const droppedFiles =
      Array.from(
        event.dataTransfer.files,
      )

    const pdfFiles =
      filterPdfFiles(droppedFiles)

    const invalidFileCount =
      droppedFiles.length -
      pdfFiles.length

    setDroppedInvalidFileCount(
      invalidFileCount > 0
        ? invalidFileCount
        : null,
    )

    if (pdfFiles.length === 0) {
      return
    }

    void importPdfs(pdfFiles)
  }

  const gridOptionalProps = {
    ...(openingBookId !== null
      ? {
          openingBookId,
        }
      : {}),
    ...(deletingBookId !== null
      ? {
          deletingBookId,
        }
      : {}),
    ...(bookPendingMetadataEdit !==
      null &&
    isUpdatingBookMetadata
      ? {
          editingBookId:
            bookPendingMetadataEdit
              .book.id,
        }
      : {}),
  }

  const showBackupErrorOutsideDialog =
    libraryBackupErrorMessage !== null &&
    (
      !hasBackupRestoreError ||
      backupFilePendingRestore === null
    )

  return (
    <section
      className={
        isPdfDragActive
          ? 'library-page library-page--drop-active'
          : 'library-page'
      }
      aria-label="Biblioteca de documentos"
      onDragEnter={handlePdfDragEnter}
      onDragOver={handlePdfDragOver}
      onDragLeave={handlePdfDragLeave}
      onDrop={handlePdfDrop}
    >
      {isPdfDragActive && (
        <div
          className="library-page__drop-overlay"
          aria-hidden="true"
        >
          <div className="library-page__drop-card">
            <span className="library-page__drop-title">
              Solte seus PDFs aqui
            </span>

            <span className="library-page__drop-description">
              Você pode importar um ou vários arquivos de uma vez.
            </span>
          </div>
        </div>
      )}
      <div className="library-page__feedback">
        {hasBackupRestoreSucceeded && (
          <FeedbackMessage
            variant={
              FeedbackMessageVariant.SUCCESS
            }
            title="Backup restaurado com sucesso"
            description="A biblioteca, os PDFs, as capas, o progresso, os favoritos, as anotações e as configurações foram restaurados."
            icon={<SuccessIcon />}
            action={
              <Button
                variant={
                  ButtonVariant.GHOST
                }
                size={ButtonSize.SMALL}
                onClick={
                  dismissBackupRestoreSuccess
                }
              >
                Fechar
              </Button>
            }
          />
        )}

        {showBackupErrorOutsideDialog && (
          <FeedbackMessage
            variant={
              FeedbackMessageVariant.ERROR
            }
            title={
              hasBackupRestoreError
                ? 'Não foi possível restaurar o backup'
                : 'Não foi possível exportar o backup'
            }
            description={
              libraryBackupErrorMessage
            }
            icon={<ErrorIcon />}
            action={
              <Button
                variant={
                  ButtonVariant.GHOST
                }
                size={ButtonSize.SMALL}
                onClick={
                  clearLibraryBackupError
                }
              >
                Fechar
              </Button>
            }
          />
        )}

        {libraryErrorMessage !== null &&
          !hasInitialLoadError &&
          !hasBookMetadataUpdateError && (
            <FeedbackMessage
              variant={
                FeedbackMessageVariant.ERROR
              }
              title="Não foi possível concluir a operação"
              description={
                libraryErrorMessage
              }
              icon={<ErrorIcon />}
              action={
                <Button
                  variant={
                    ButtonVariant.GHOST
                  }
                  size={ButtonSize.SMALL}
                  onClick={
                    clearLibraryError
                  }
                >
                  Fechar
                </Button>
              }
            />
          )}

        {droppedInvalidFileCount !== null && (
          <FeedbackMessage
            variant={
              FeedbackMessageVariant.WARNING
            }
            title="Arquivos ignorados"
            description={
              droppedInvalidFileCount === 1
                ? '1 arquivo não era um PDF válido para importação e foi ignorado.'
                : `${droppedInvalidFileCount} arquivos não eram PDFs válidos para importação e foram ignorados.`
            }
            icon={<WarningIcon />}
            action={
              <Button
                variant={
                  ButtonVariant.GHOST
                }
                size={ButtonSize.SMALL}
                onClick={() => {
                  setDroppedInvalidFileCount(
                    null,
                  )
                }}
              >
                Entendi
              </Button>
            }
          />
        )}

        {importWarnings.length > 0 && (
          <FeedbackMessage
            variant={
              FeedbackMessageVariant.WARNING
            }
            title="PDF importado com avisos"
            description="O documento foi salvo na biblioteca, mas alguns detalhes precisam de atenção."
            icon={<WarningIcon />}
            action={
              <Button
                variant={
                  ButtonVariant.GHOST
                }
                size={ButtonSize.SMALL}
                onClick={
                  clearImportWarnings
                }
              >
                Entendi
              </Button>
            }
          >
            <ul className="library-page__warning-list">
              {importWarnings.map(
                (warningCode) => (
                  <li
                    key={warningCode}
                    className="library-page__warning-item"
                  >
                    {getImportWarningMessage(
                      warningCode,
                    )}
                  </li>
                ),
              )}
            </ul>
          </FeedbackMessage>
        )}
      </div>

      <div className="library-page__content">
        {isInitialLoading && (
          <div className="library-page__loading">
            <LoadingIndicator
              size={
                LoadingIndicatorSize.LARGE
              }
              label="Carregando sua biblioteca..."
              vertical
            />
          </div>
        )}

        {hasInitialLoadError && (
          <div className="library-page__empty">
            <EmptyState
              title="Não foi possível carregar a biblioteca"
              description={
                libraryErrorMessage ??
                'O armazenamento local não pôde ser acessado.'
              }
              icon={<ErrorIcon />}
              actions={
                <Button
                  variant={
                    ButtonVariant.PRIMARY
                  }
                  leadingIcon={
                    <ReloadIcon />
                  }
                  onClick={
                    retryLibraryLoading
                  }
                >
                  Tentar novamente
                </Button>
              }
            />
          </div>
        )}

        {!isInitialLoading &&
          !hasInitialLoadError && (
            <>
              <LibraryToolbar
                primaryAction={
                  <PdfImportButton
                  label="Adicionar PDF"
                  />
                }
                totalBooks={
                  libraryItems.length
                }
                searchQuery={
                  searchQuery
                }
                readingFilter={
                  readingFilter
                }
                viewMode={
                  libraryViewMode
                }
                sortMode={
                  librarySortMode
                }
                disabled={
                  libraryLoadStatus ===
                    AsyncStatus.LOADING ||
                  isDeleting ||
                  isUpdatingBookMetadata
                }
                backupExporting={
                  isBackupExporting
                }
                backupRestoring={
                  isBackupRestoring
                }
                onSearchQueryChange={
                  setSearchQuery
                }
                onReadingFilterChange={
                  setReadingFilter
                }
                onViewModeChange={
                  handleLibraryViewModeChange
                }
                onSortModeChange={
                  setLibrarySortMode
                }
                onExportBackup={
                  exportLibraryBackup
                }
                onBackupFileSelected={
                  requestBackupRestore
                }
              />

              {libraryItems.length > 0 && (
                <section
                  className="library-page__reading-summary"
                  aria-label="Resumo de leitura da biblioteca"
                >
                  <button
                    type="button"
                    className={
                      readingFilter ===
                      LibraryReadingFilter.ALL
                        ? 'library-page__summary-card library-page__summary-card--active'
                        : 'library-page__summary-card'
                    }
                    aria-pressed={
                      readingFilter ===
                      LibraryReadingFilter.ALL
                    }
                    onClick={() => {
                      setReadingFilter(
                        LibraryReadingFilter.ALL,
                      )
                    }}
                  >
                    <span className="library-page__summary-value">
                      {readingSummary.total}
                    </span>
                    <span className="library-page__summary-label">
                      Todos
                    </span>
                  </button>

                  <button
                    type="button"
                    className={
                      readingFilter ===
                      LibraryReadingFilter.NOT_STARTED
                        ? 'library-page__summary-card library-page__summary-card--active'
                        : 'library-page__summary-card'
                    }
                    aria-pressed={
                      readingFilter ===
                      LibraryReadingFilter.NOT_STARTED
                    }
                    onClick={() => {
                      setReadingFilter(
                        LibraryReadingFilter.NOT_STARTED,
                      )
                    }}
                  >
                    <span className="library-page__summary-value">
                      {readingSummary.notStarted}
                    </span>
                    <span className="library-page__summary-label">
                      Não iniciados
                    </span>
                  </button>

                  <button
                    type="button"
                    className={
                      readingFilter ===
                      LibraryReadingFilter.IN_PROGRESS
                        ? 'library-page__summary-card library-page__summary-card--active'
                        : 'library-page__summary-card'
                    }
                    aria-pressed={
                      readingFilter ===
                      LibraryReadingFilter.IN_PROGRESS
                    }
                    onClick={() => {
                      setReadingFilter(
                        LibraryReadingFilter.IN_PROGRESS,
                      )
                    }}
                  >
                    <span className="library-page__summary-value">
                      {readingSummary.inProgress}
                    </span>
                    <span className="library-page__summary-label">
                      Em andamento
                    </span>
                  </button>

                  <button
                    type="button"
                    className={
                      readingFilter ===
                      LibraryReadingFilter.COMPLETED
                        ? 'library-page__summary-card library-page__summary-card--active'
                        : 'library-page__summary-card'
                    }
                    aria-pressed={
                      readingFilter ===
                      LibraryReadingFilter.COMPLETED
                    }
                    onClick={() => {
                      setReadingFilter(
                        LibraryReadingFilter.COMPLETED,
                      )
                    }}
                  >
                    <span className="library-page__summary-value">
                      {readingSummary.completed}
                    </span>
                    <span className="library-page__summary-label">
                      Concluídos
                    </span>
                  </button>
                </section>
              )}

              {!hasActiveLibraryFilter &&
                continueReadingItems.length >
                  0 && (
                <section
                  className="library-page__continue-reading"
                  aria-labelledby="continue-reading-title"
                >
                  <div className="library-page__section-heading">
                    <div>
                      <h2
                        id="continue-reading-title"
                        className="library-page__section-title"
                      >
                        Continue lendo
                      </h2>

                      <p className="library-page__section-description">
                        Retome rapidamente suas leituras mais recentes.
                      </p>
                    </div>
                  </div>

                  <LibraryGrid
                    {...gridOptionalProps}
                    className="library-page__continue-grid"
                    items={
                      continueReadingItems
                    }
                    onOpenBook={
                      handleOpenBook
                    }
                    onDeleteBook={
                      requestBookDeletion
                    }
                    onEditBook={
                      requestBookMetadataEdit
                    }
                  />
                </section>
              )}

              {libraryItems.length ===
                0 && (
                <div className="library-page__empty">
                  <EmptyState
                    title="Sua biblioteca está vazia"
                    description="Importe seu primeiro PDF ou restaure um backup para começar uma experiência de leitura local, rápida e imersiva."
                    icon={
                      <LibraryIcon />
                    }
                    actions={
                      <PdfImportButton />
                    }
                  />
                </div>
              )}

              {libraryItems.length >
                0 &&
                filteredLibraryItems
                  .length === 0 &&
                hasActiveLibraryFilter && (
                <div className="library-page__empty">
                  <EmptyState
                    title="Nenhum documento encontrado"
                    description={
                      hasActiveSearch &&
                      hasActiveReadingFilter
                        ? `Nenhum PDF corresponde à busca “${normalizedSearchQuery}” dentro do filtro de leitura selecionado.`
                        : hasActiveSearch
                          ? `Nenhum PDF corresponde à busca “${normalizedSearchQuery}”. Tente outro título, autor ou nome de arquivo.`
                          : 'Nenhum PDF corresponde ao status de leitura selecionado.'
                    }
                    icon={
                      <LibraryIcon />
                    }
                    actions={
                      <Button
                        variant={
                          ButtonVariant.GHOST
                        }
                        onClick={
                          clearLibraryFilters
                        }
                      >
                        Limpar filtros
                      </Button>
                    }
                  />
                </div>
              )}

              {filteredLibraryItems
                .length > 0 && (
                <LibraryGrid
                  {...gridOptionalProps}
                  viewMode={
                    libraryViewMode
                  }
                  items={
                    filteredLibraryItems
                  }
                  onOpenBook={
                    handleOpenBook
                  }
                  onDeleteBook={
                    requestBookDeletion
                  }
                  onEditBook={
                    requestBookMetadataEdit
                  }
                />
              )}
            </>
          )}
      </div>

      {bookPendingMetadataEdit !==
        null && (
        <EditBookMetadataDialog
          item={
            bookPendingMetadataEdit
          }
          isSaving={
            isUpdatingBookMetadata
          }
          errorMessage={
            hasBookMetadataUpdateError
              ? libraryErrorMessage
              : null
          }
          onSave={
            saveBookMetadata
          }
          onCancel={
            cancelBookMetadataEdit
          }
        />
      )}

      <ConfirmDialog
        open={
          bookPendingDeletion !== null
        }
        title="Excluir este PDF?"
        description="Esta ação removerá o documento e todos os dados de leitura armazenados localmente."
        confirmLabel="Excluir PDF"
        cancelLabel="Cancelar"
        destructive
        isConfirming={isDeleting}
        onConfirm={
          confirmBookDeletion
        }
        onCancel={
          cancelBookDeletion
        }
      >
        {bookPendingDeletion !==
          null && (
          <div className="library-page__delete-details">
            <div className="library-page__delete-book">
              <span className="library-page__delete-book-title">
                {
                  bookPendingDeletion
                    .book.title
                }
              </span>

              <span className="library-page__delete-book-file">
                {
                  bookPendingDeletion
                    .book
                    .originalFileName
                }
              </span>
            </div>

            <p className="library-page__delete-explanation">
              O PDF original, a capa, o
              progresso e os favoritos
              deste livro serão removidos.
              O arquivo original existente
              fora do aplicativo não será
              alterado.
            </p>

            {bookDeleteStatus ===
              AsyncStatus.ERROR &&
              libraryErrorMessage !==
                null && (
                <FeedbackMessage
                  variant={
                    FeedbackMessageVariant.ERROR
                  }
                  title="A exclusão não foi concluída"
                  description={
                    libraryErrorMessage
                  }
                  icon={
                    <ErrorIcon />
                  }
                  compact
                />
              )}
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={
          backupFilePendingRestore !==
          null
        }
        title="Restaurar este backup?"
        description="A biblioteca atual será substituída pelos dados contidos no arquivo selecionado."
        confirmLabel="Restaurar backup"
        cancelLabel="Cancelar"
        destructive
        isConfirming={
          isBackupRestoring
        }
        onConfirm={
          confirmBackupRestore
        }
        onCancel={
          cancelBackupRestore
        }
      >
        {backupFilePendingRestore !==
          null && (
          <div className="library-page__delete-details">
            <div className="library-page__delete-book">
              <span className="library-page__delete-book-title">
                Arquivo selecionado
              </span>

              <span className="library-page__delete-book-file">
                {
                  backupFilePendingRestore.name
                }
              </span>
            </div>

            <p className="library-page__delete-explanation">
              Todos os livros, PDFs,
              capas, progressos, favoritos
              e configurações atualmente
              armazenados no aplicativo
              serão substituídos. O
              processo somente será
              concluído se todo o backup
              for validado corretamente.
            </p>

            {hasBackupRestoreError &&
              libraryBackupErrorMessage !==
                null && (
                <FeedbackMessage
                  variant={
                    FeedbackMessageVariant.ERROR
                  }
                  title="A restauração não foi concluída"
                  description={
                    libraryBackupErrorMessage
                  }
                  icon={
                    <ErrorIcon />
                  }
                  compact
                />
              )}
          </div>
        )}
      </ConfirmDialog>
    </section>
  )
}
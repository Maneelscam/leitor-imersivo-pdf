import { useState } from 'react'

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
  LibraryGrid,
} from '@/features/library/components/LibraryGrid'
import {
  LibraryToolbar,
} from '@/features/library/components/LibraryToolbar'
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
import type {
  BookId,
} from '@/models/value-objects/BookId'
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
  selectClearImportWarnings,
  selectClearLibraryError,
  selectDeleteBook,
  selectLastImportWarnings,
  selectLibraryErrorMessage,
  selectLibraryItems,
  selectLibraryLoadStatus,
  selectLibrarySortMode,
  selectLoadLibrary,
  selectSetLibrarySortMode,
} from '@/stores/selectors/librarySelectors'
import {
  selectOpenBook,
} from '@/stores/selectors/readerSelectors'
import {
  useAppStore,
} from '@/stores/useAppStore'

import '@/styles/components/library-page.css'

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

  const bookDeleteStatus = useAppStore(
    selectBookDeleteStatus,
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

  const setLibrarySortMode = useAppStore(
    selectSetLibrarySortMode,
  )

  const openBook = useAppStore(
    selectOpenBook,
  )

  const deleteBook = useAppStore(
    selectDeleteBook,
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
    deletingBookId,
    setDeletingBookId,
  ] = useState<BookId | null>(null)

  const [
    bookPendingDeletion,
    setBookPendingDeletion,
  ] = useState<LibraryBookItem | null>(null)

  const [
    backupFilePendingRestore,
    setBackupFilePendingRestore,
  ] = useState<File | null>(null)

  const isInitialLoading =
    libraryItems.length === 0 &&
    (
      libraryLoadStatus === AsyncStatus.IDLE ||
      libraryLoadStatus === AsyncStatus.LOADING
    )

  const hasInitialLoadError =
    libraryItems.length === 0 &&
    libraryLoadStatus === AsyncStatus.ERROR

  const isDeleting =
    bookDeleteStatus === AsyncStatus.LOADING

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

  const requestBookDeletion = (
    bookId: BookId,
  ) => {
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
  }

  const showBackupErrorOutsideDialog =
    libraryBackupErrorMessage !== null &&
    (
      !hasBackupRestoreError ||
      backupFilePendingRestore === null
    )

  return (
    <section
      className="library-page"
      aria-label="Biblioteca de documentos"
    >
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
          !hasInitialLoadError && (
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
                totalBooks={
                  libraryItems.length
                }
                sortMode={
                  librarySortMode
                }
                disabled={
                  libraryLoadStatus ===
                    AsyncStatus.LOADING ||
                  isDeleting
                }
                backupExporting={
                  isBackupExporting
                }
                backupRestoring={
                  isBackupRestoring
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
                0 && (
                <LibraryGrid
                  {...gridOptionalProps}
                  items={
                    libraryItems
                  }
                  onOpenBook={
                    handleOpenBook
                  }
                  onDeleteBook={
                    requestBookDeletion
                  }
                />
              )}
            </>
          )}
      </div>

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
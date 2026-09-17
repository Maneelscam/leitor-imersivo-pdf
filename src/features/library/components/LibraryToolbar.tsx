import {
  useId,
  useRef,
  type ChangeEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react'

import {
  LibraryReadingFilter,
  type LibraryReadingFilter as LibraryReadingFilterValue,
  isLibraryReadingFilter,
} from '@/models/enums/LibraryReadingFilter'
import {
  LibrarySortMode,
  type LibrarySortMode as LibrarySortModeValue,
} from '@/models/enums/LibrarySortMode'

import '@/styles/components/library-toolbar.css'

export interface LibraryToolbarProps
  extends HTMLAttributes<HTMLDivElement> {
  readonly totalBooks: number

  readonly sortMode:
    LibrarySortModeValue

  readonly readingFilter:
    LibraryReadingFilterValue

  readonly searchQuery:
    string

  readonly disabled?: boolean

  readonly backupExporting?: boolean

  readonly backupRestoring?: boolean

  readonly primaryAction?: ReactNode

  readonly onSearchQueryChange: (
    searchQuery: string,
  ) => void

  readonly onReadingFilterChange: (
    readingFilter:
      LibraryReadingFilterValue,
  ) => void

  readonly onSortModeChange: (
    sortMode: LibrarySortModeValue,
  ) => void | Promise<void>

  readonly onExportBackup?: () =>
    void | Promise<void>

  readonly onBackupFileSelected?: (
    archiveFile: File,
  ) => void | Promise<void>
}

function createLibraryToolbarClassName(
  customClassName: string | undefined,
): string {
  const classNames = [
    'library-toolbar',
  ]

  if (
    customClassName !== undefined &&
    customClassName.trim().length > 0
  ) {
    classNames.push(
      customClassName,
    )
  }

  return classNames.join(' ')
}

function formatBookCount(
  totalBooks: number,
): string {
  if (totalBooks === 0) {
    return 'Nenhum documento importado'
  }

  if (totalBooks === 1) {
    return '1 documento importado'
  }

  return `${totalBooks} documentos importados`
}

export function LibraryToolbar({
  totalBooks,
  sortMode,
  readingFilter,
  searchQuery,
  disabled = false,
  backupExporting = false,
  backupRestoring = false,
  primaryAction,
  onSearchQueryChange,
  onReadingFilterChange,
  onSortModeChange,
  onExportBackup,
  onBackupFileSelected,
  className,
  ...containerProps
}: LibraryToolbarProps) {
  const searchInputId = useId()
  const readingFilterSelectId =
    useId()
  const sortSelectId = useId()
  const backupFileInputId = useId()

  const backupFileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    )

  const toolbarClassName =
    createLibraryToolbarClassName(
      className,
    )

  const normalizedTotalBooks =
    Math.max(
      0,
      Math.trunc(totalBooks),
    )

  const backupOperationRunning =
    backupExporting ||
    backupRestoring

  const exportButtonDisabled =
    disabled ||
    backupOperationRunning ||
    onExportBackup === undefined

  const restoreButtonDisabled =
    disabled ||
    backupOperationRunning ||
    onBackupFileSelected === undefined

  const handleSearchQueryChange = (
    event:
      ChangeEvent<HTMLInputElement>,
  ) => {
    onSearchQueryChange(
      event.currentTarget.value,
    )
  }

  const handleReadingFilterChange = (
    event:
      ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedReadingFilter =
      event.currentTarget.value

    if (
      !isLibraryReadingFilter(
        selectedReadingFilter,
      )
    ) {
      return
    }

    onReadingFilterChange(
      selectedReadingFilter,
    )
  }

  const handleSortModeChange = (
    event:
      ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedSortMode =
      event.currentTarget.value

    if (
      !Object.values(
        LibrarySortMode,
      ).includes(
        selectedSortMode as
          LibrarySortModeValue,
      )
    ) {
      return
    }

    void onSortModeChange(
      selectedSortMode as
        LibrarySortModeValue,
    )
  }

  const handleExportBackup = () => {
    if (
      exportButtonDisabled ||
      onExportBackup === undefined
    ) {
      return
    }

    void onExportBackup()
  }

  const handleOpenBackupFilePicker = () => {
    if (
      restoreButtonDisabled
    ) {
      return
    }

    backupFileInputRef.current?.click()
  }

  const handleBackupFileChange = (
    event:
      ChangeEvent<HTMLInputElement>,
  ) => {
    const archiveFile =
      event.currentTarget.files?.item(
        0,
      )

    event.currentTarget.value = ''

    if (
      archiveFile === null ||
      archiveFile === undefined ||
      onBackupFileSelected === undefined
    ) {
      return
    }

    void onBackupFileSelected(
      archiveFile,
    )
  }

  return (
    <div
      {...containerProps}
      className={toolbarClassName}
    >
      <div className="library-toolbar__summary">
        <h2 className="library-toolbar__title">
          Minha biblioteca
        </h2>

        <p
          className="library-toolbar__description"
          aria-live="polite"
        >
          {formatBookCount(
            normalizedTotalBooks,
          )}
        </p>
      </div>

      <div className="library-toolbar__controls">
        <div className="library-toolbar__search">
          <label
            className="library-toolbar__search-label"
            htmlFor={searchInputId}
          >
            Buscar
          </label>

          <div className="library-toolbar__search-field">
            <svg
              className="library-toolbar__search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
              />
              <path d="m20 20-4-4" />
            </svg>

            <input
              id={searchInputId}
              className="library-toolbar__search-input"
              type="search"
              value={searchQuery}
              disabled={disabled}
              placeholder="Título, autor ou arquivo"
              autoComplete="off"
              aria-label="Buscar na biblioteca"
              onChange={
                handleSearchQueryChange
              }
            />
          </div>
        </div>

        {primaryAction}

        <input
          ref={backupFileInputRef}
          id={backupFileInputId}
          className="library-toolbar__backup-input"
          type="file"
          accept=".zip,application/zip"
          tabIndex={-1}
          aria-hidden="true"
          onChange={
            handleBackupFileChange
          }
        />

        <button
          type="button"
          className="library-toolbar__backup-button"
          disabled={
            restoreButtonDisabled
          }
          aria-controls={
            backupFileInputId
          }
          aria-busy={
            backupRestoring
          }
          onClick={
            handleOpenBackupFilePicker
          }
        >
          {backupRestoring
            ? 'Restaurando...'
            : 'Restaurar backup'}
        </button>

        <button
          type="button"
          className="library-toolbar__backup-button"
          disabled={
            exportButtonDisabled
          }
          aria-busy={
            backupExporting
          }
          onClick={
            handleExportBackup
          }
        >
          {backupExporting
            ? 'Exportando...'
            : 'Exportar backup'}
        </button>

        <div className="library-toolbar__field">
          <label
            className="library-toolbar__label"
            htmlFor={
              readingFilterSelectId
            }
          >
            Leitura
          </label>

          <select
            id={
              readingFilterSelectId
            }
            className="library-toolbar__select"
            value={readingFilter}
            disabled={
              disabled ||
              backupOperationRunning
            }
            aria-label="Filtrar por status de leitura"
            onChange={
              handleReadingFilterChange
            }
          >
            <option
              value={
                LibraryReadingFilter.ALL
              }
            >
              Todos
            </option>

            <option
              value={
                LibraryReadingFilter.NOT_STARTED
              }
            >
              Não iniciados
            </option>

            <option
              value={
                LibraryReadingFilter.IN_PROGRESS
              }
            >
              Em andamento
            </option>

            <option
              value={
                LibraryReadingFilter.COMPLETED
              }
            >
              Concluídos
            </option>
          </select>
        </div>

        <div className="library-toolbar__field">
          <label
            className="library-toolbar__label"
            htmlFor={sortSelectId}
          >
            Ordenar por
          </label>

          <select
            id={sortSelectId}
            className="library-toolbar__select"
            value={sortMode}
            disabled={
              disabled ||
              backupOperationRunning
            }
            aria-label="Ordenar biblioteca"
            onChange={
              handleSortModeChange
            }
          >
            <option
              value={
                LibrarySortMode.RECENTLY_OPENED
              }
            >
              Abertos recentemente
            </option>

            <option
              value={
                LibrarySortMode.RECENTLY_IMPORTED
              }
            >
              Importados recentemente
            </option>

            <option
              value={
                LibrarySortMode.TITLE_ASCENDING
              }
            >
              Título de A a Z
            </option>

            <option
              value={
                LibrarySortMode.TITLE_DESCENDING
              }
            >
              Título de Z a A
            </option>
          </select>
        </div>
      </div>
    </div>
  )
}
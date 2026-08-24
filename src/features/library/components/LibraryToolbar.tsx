import {
  useId,
  useRef,
  type ChangeEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react'

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

  readonly disabled?: boolean

  readonly backupExporting?: boolean

  readonly backupRestoring?: boolean

  readonly primaryAction?: ReactNode

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
  disabled = false,
  backupExporting = false,
  backupRestoring = false,
  primaryAction,
  onSortModeChange,
  onExportBackup,
  onBackupFileSelected,
  className,
  ...containerProps
}: LibraryToolbarProps) {
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
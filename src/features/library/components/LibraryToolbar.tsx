import {
  useId,
  type ChangeEvent,
  type HTMLAttributes,
} from 'react'

import {
  LibrarySortMode,
  type LibrarySortMode as LibrarySortModeValue,
} from '@/models/enums/LibrarySortMode'

import '@/styles/components/library-toolbar.css'

export interface LibraryToolbarProps
  extends HTMLAttributes<HTMLDivElement> {
  readonly totalBooks: number
  readonly sortMode: LibrarySortModeValue
  readonly disabled?: boolean

  readonly onSortModeChange: (
    sortMode: LibrarySortModeValue,
  ) => void | Promise<void>
}

function createLibraryToolbarClassName(
  customClassName: string | undefined,
): string {
  const classNames = ['library-toolbar']

  if (
    customClassName !== undefined &&
    customClassName.trim().length > 0
  ) {
    classNames.push(customClassName)
  }

  return classNames.join(' ')
}

function formatBookCount(totalBooks: number): string {
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
  onSortModeChange,
  className,
  ...containerProps
}: LibraryToolbarProps) {
  const sortSelectId = useId()

  const toolbarClassName =
    createLibraryToolbarClassName(className)

  const normalizedTotalBooks = Math.max(
    0,
    Math.trunc(totalBooks),
  )

  const handleSortModeChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedSortMode =
      event.currentTarget.value

    if (
      !Object.values(LibrarySortMode).includes(
        selectedSortMode as LibrarySortModeValue,
      )
    ) {
      return
    }

    void onSortModeChange(
      selectedSortMode as LibrarySortModeValue,
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
          {formatBookCount(normalizedTotalBooks)}
        </p>
      </div>

      <div className="library-toolbar__controls">
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
            disabled={disabled}
            aria-label="Ordenar biblioteca"
            onChange={handleSortModeChange}
          >
            <option
              value={LibrarySortMode.RECENTLY_OPENED}
            >
              Abertos recentemente
            </option>

            <option
              value={LibrarySortMode.RECENTLY_IMPORTED}
            >
              Importados recentemente
            </option>

            <option
              value={LibrarySortMode.TITLE_ASCENDING}
            >
              Título de A a Z
            </option>

            <option
              value={LibrarySortMode.TITLE_DESCENDING}
            >
              Título de Z a A
            </option>
          </select>
        </div>
      </div>
    </div>
  )
}
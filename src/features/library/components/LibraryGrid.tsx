import type {
  HTMLAttributes,
} from 'react'

import { LibraryBookCard } from '@/features/library/components/LibraryBookCard'
import type { LibraryBookItem } from '@/models/dtos/LibraryBookItem'
import {
  LibraryViewMode,
  type LibraryViewMode as LibraryViewModeValue,
} from '@/models/enums/LibraryViewMode'
import type { BookId } from '@/models/value-objects/BookId'

import '@/styles/components/library-grid.css'

export interface LibraryGridProps
  extends HTMLAttributes<HTMLUListElement> {
  readonly items: readonly LibraryBookItem[]

  readonly viewMode?:
    LibraryViewModeValue

  readonly openingBookId?: BookId
  readonly deletingBookId?: BookId
  readonly editingBookId?: BookId

  readonly onOpenBook: (
    bookId: BookId,
  ) => void | Promise<void>

  readonly onDeleteBook: (
    bookId: BookId,
  ) => void | Promise<void>

  readonly onEditBook: (
    bookId: BookId,
  ) => void

  readonly onManageCollections?: (
    bookId: BookId,
  ) => void
}

function createLibraryGridClassName(
  viewMode: LibraryViewModeValue,
  customClassName: string | undefined,
): string {
  const classNames = [
    'library-grid',
    `library-grid--${viewMode}`,
  ]

  if (
    customClassName !== undefined &&
    customClassName.trim().length > 0
  ) {
    classNames.push(customClassName)
  }

  return classNames.join(' ')
}

export function LibraryGrid({
  items,
  viewMode = LibraryViewMode.GRID,
  openingBookId,
  deletingBookId,
  editingBookId,
  onOpenBook,
  onDeleteBook,
  onEditBook,
  onManageCollections,
  className,
  ...listProps
}: LibraryGridProps) {
  const libraryGridClassName =
    createLibraryGridClassName(
      viewMode,
      className,
    )

  return (
    <ul
      {...listProps}
      className={libraryGridClassName}
      aria-label="Livros da biblioteca"
    >
      {items.map((item) => {
        const bookId = item.book.id

        return (
          <li
            key={bookId}
            className="library-grid__item"
          >
            <LibraryBookCard
              item={item}
              className={
                viewMode ===
                LibraryViewMode.LIST
                  ? 'library-book-card--list'
                  : undefined
              }
              isOpening={
                openingBookId === bookId
              }
              isDeleting={
                deletingBookId === bookId
              }
              isEditing={
                editingBookId === bookId
              }
              onOpen={onOpenBook}
              onDelete={onDeleteBook}
              onEdit={onEditBook}
              {...(
                onManageCollections !== undefined
                  ? {
                      onManageCollections,
                    }
                  : {}
              )}
            />
          </li>
        )
      })}
    </ul>
  )
}
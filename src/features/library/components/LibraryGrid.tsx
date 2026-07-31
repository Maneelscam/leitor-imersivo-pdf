import type {
  HTMLAttributes,
} from 'react'

import { LibraryBookCard } from '@/features/library/components/LibraryBookCard'
import type { LibraryBookItem } from '@/models/dtos/LibraryBookItem'
import type { BookId } from '@/models/value-objects/BookId'

import '@/styles/components/library-grid.css'

export interface LibraryGridProps
  extends HTMLAttributes<HTMLUListElement> {
  readonly items: readonly LibraryBookItem[]

  readonly openingBookId?: BookId
  readonly deletingBookId?: BookId

  readonly onOpenBook: (
    bookId: BookId,
  ) => void | Promise<void>

  readonly onDeleteBook: (
    bookId: BookId,
  ) => void | Promise<void>
}

function createLibraryGridClassName(
  customClassName: string | undefined,
): string {
  const classNames = ['library-grid']

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
  openingBookId,
  deletingBookId,
  onOpenBook,
  onDeleteBook,
  className,
  ...listProps
}: LibraryGridProps) {
  const libraryGridClassName =
    createLibraryGridClassName(className)

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
              isOpening={
                openingBookId === bookId
              }
              isDeleting={
                deletingBookId === bookId
              }
              onOpen={onOpenBook}
              onDelete={onDeleteBook}
            />
          </li>
        )
      })}
    </ul>
  )
}
import type {
  LibraryBookItem,
} from '@/models/dtos/LibraryBookItem'
import {
  LibraryReadingFilter,
  type LibraryReadingFilter as LibraryReadingFilterValue,
} from '@/models/enums/LibraryReadingFilter'
import {
  calculateReadingProgressRatio,
} from '@/utils/formatters/formatReadingProgress'

function matchesReadingFilter(
  item: LibraryBookItem,
  readingFilter:
    LibraryReadingFilterValue,
): boolean {
  if (
    readingFilter ===
    LibraryReadingFilter.ALL
  ) {
    return true
  }

  const progressRatio =
    calculateReadingProgressRatio(
      item.readingProgress,
      item.book.totalPages,
    )

  switch (readingFilter) {
    case LibraryReadingFilter.NOT_STARTED:
      return progressRatio <= 0

    case LibraryReadingFilter.IN_PROGRESS:
      return (
        progressRatio > 0 &&
        progressRatio < 1
      )

    case LibraryReadingFilter.COMPLETED:
      return progressRatio >= 1
  }
}

export function filterLibraryItemsByReadingStatus(
  items: readonly LibraryBookItem[],
  readingFilter:
    LibraryReadingFilterValue,
): readonly LibraryBookItem[] {
  if (
    readingFilter ===
    LibraryReadingFilter.ALL
  ) {
    return items
  }

  return items.filter(
    (item) =>
      matchesReadingFilter(
        item,
        readingFilter,
      ),
  )
}

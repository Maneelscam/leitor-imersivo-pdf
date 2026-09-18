import type {
  LibraryBookItem,
} from '@/models/dtos/LibraryBookItem'
import {
  calculateReadingProgressRatio,
} from '@/utils/formatters/formatReadingProgress'

const DEFAULT_CONTINUE_READING_LIMIT = 3

function getLastReadingActivity(
  item: LibraryBookItem,
): string {
  return (
    item.book.lastOpenedAt ??
    item.readingProgress?.updatedAt ??
    item.book.updatedAt
  )
}

export function getContinueReadingItems(
  items: readonly LibraryBookItem[],
  limit = DEFAULT_CONTINUE_READING_LIMIT,
): readonly LibraryBookItem[] {
  const normalizedLimit = Math.max(
    0,
    Math.trunc(limit),
  )

  if (normalizedLimit === 0) {
    return []
  }

  return items
    .filter((item) => {
      const progressRatio =
        calculateReadingProgressRatio(
          item.readingProgress,
          item.book.totalPages,
        )

      return (
        progressRatio > 0 &&
        progressRatio < 1
      )
    })
    .sort((first, second) =>
      getLastReadingActivity(second)
        .localeCompare(
          getLastReadingActivity(first),
        ),
    )
    .slice(0, normalizedLimit)
}

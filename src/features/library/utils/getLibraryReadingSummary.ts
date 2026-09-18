import type {
  LibraryBookItem,
} from '@/models/dtos/LibraryBookItem'
import {
  calculateReadingProgressRatio,
} from '@/utils/formatters/formatReadingProgress'

export interface LibraryReadingSummary {
  readonly total: number
  readonly notStarted: number
  readonly inProgress: number
  readonly completed: number
}

export function getLibraryReadingSummary(
  items: readonly LibraryBookItem[],
): LibraryReadingSummary {
  let notStarted = 0
  let inProgress = 0
  let completed = 0

  for (const item of items) {
    const progressRatio =
      calculateReadingProgressRatio(
        item.readingProgress,
        item.book.totalPages,
      )

    if (progressRatio <= 0) {
      notStarted += 1
      continue
    }

    if (progressRatio >= 1) {
      completed += 1
      continue
    }

    inProgress += 1
  }

  return {
    total: items.length,
    notStarted,
    inProgress,
    completed,
  }
}

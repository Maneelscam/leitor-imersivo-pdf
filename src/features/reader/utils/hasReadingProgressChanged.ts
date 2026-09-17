import type {
  ReadingProgress,
} from '@/models/entities/ReadingProgress'

const PAGE_OFFSET_EPSILON =
  0.001

export function hasReadingProgressChanged(
  readingProgress:
    ReadingProgress | null,
  currentPage: number,
  pageOffsetRatio: number,
): boolean {
  if (readingProgress === null) {
    return (
      currentPage !== 1 ||
      Math.abs(
        pageOffsetRatio,
      ) > PAGE_OFFSET_EPSILON
    )
  }

  return (
    readingProgress.currentPage !==
      currentPage ||
    Math.abs(
      readingProgress
        .pageOffsetRatio -
        pageOffsetRatio,
    ) > PAGE_OFFSET_EPSILON
  )
}

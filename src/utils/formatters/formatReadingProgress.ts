import type { ReadingProgress } from '@/models/entities/ReadingProgress'

const percentageFormatter = new Intl.NumberFormat(
  'pt-BR',
  {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  },
)

function clampPercentage(value: number): number {
  return Math.min(Math.max(value, 0), 1)
}

function isValidTotalPages(
  totalPages: number,
): boolean {
  return (
    Number.isInteger(totalPages) &&
    totalPages > 0
  )
}

export function calculateReadingProgressRatio(
  readingProgress: ReadingProgress | null,
  totalPages: number,
): number {
  if (
    readingProgress === null ||
    !isValidTotalPages(totalPages)
  ) {
    return 0
  }

  const completedPages =
    readingProgress.currentPage - 1

  const pageOffsetRatio = clampPercentage(
    readingProgress.pageOffsetRatio,
  )

  const progressRatio =
    (completedPages + pageOffsetRatio) /
    totalPages

  return clampPercentage(progressRatio)
}

export function formatReadingProgress(
  readingProgress: ReadingProgress | null,
  totalPages: number,
): string {
  if (readingProgress === null) {
    return 'Não iniciado'
  }

  const progressRatio =
    calculateReadingProgressRatio(
      readingProgress,
      totalPages,
    )

  return percentageFormatter.format(progressRatio)
}
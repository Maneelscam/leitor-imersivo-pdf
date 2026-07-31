import type { Book } from '@/models/entities/Book'
import type { BookCover } from '@/models/entities/BookCover'
import type { ReadingProgress } from '@/models/entities/ReadingProgress'

export interface LibraryBookItem {
  readonly book: Book
  readonly cover: BookCover | null
  readonly readingProgress: ReadingProgress | null
}
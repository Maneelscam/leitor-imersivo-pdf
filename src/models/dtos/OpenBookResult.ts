import type { Book } from '@/models/entities/Book'
import type { BookFile } from '@/models/entities/BookFile'
import type { ReadingProgress } from '@/models/entities/ReadingProgress'

export interface OpenBookResult {
  readonly book: Book
  readonly bookFile: BookFile
  readonly readingProgress: ReadingProgress | null
}
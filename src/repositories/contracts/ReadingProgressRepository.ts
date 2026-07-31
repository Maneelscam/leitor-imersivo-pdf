import type { ReadingProgress } from '@/models/entities/ReadingProgress'
import type { BookId } from '@/models/value-objects/BookId'

export interface ReadingProgressRepository {
  save(readingProgress: ReadingProgress): Promise<void>

  findByBookId(bookId: BookId): Promise<ReadingProgress | null>

  deleteByBookId(bookId: BookId): Promise<void>
}
import type { BookCover } from '@/models/entities/BookCover'
import type { BookId } from '@/models/value-objects/BookId'

export interface BookCoverRepository {
  save(bookCover: BookCover): Promise<void>

  findByBookId(bookId: BookId): Promise<BookCover | null>

  deleteByBookId(bookId: BookId): Promise<void>
}
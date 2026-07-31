import type { BookFile } from '@/models/entities/BookFile'
import type { BookId } from '@/models/value-objects/BookId'

export interface BookFileRepository {
  save(bookFile: BookFile): Promise<void>

  findByBookId(bookId: BookId): Promise<BookFile | null>

  deleteByBookId(bookId: BookId): Promise<void>
}
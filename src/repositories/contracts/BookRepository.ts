import type { Book } from '@/models/entities/Book'
import type { BookId } from '@/models/value-objects/BookId'

export interface BookRepository {
  save(book: Book): Promise<void>

  findById(bookId: BookId): Promise<Book | null>

  findByPdfFingerprint(
    pdfFingerprint: string,
  ): Promise<Book | null>

  findAll(): Promise<readonly Book[]>

  deleteById(bookId: BookId): Promise<void>
}
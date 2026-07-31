import type { Book } from '@/models/entities/Book'
import type { BookCover } from '@/models/entities/BookCover'
import type { BookFile } from '@/models/entities/BookFile'

export interface ImportedBookData {
  readonly book: Book
  readonly bookFile: BookFile
  readonly bookCover: BookCover | null
}
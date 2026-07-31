import type { ImportedBookData } from '@/models/dtos/ImportedBookData'
import type { BookId } from '@/models/value-objects/BookId'

export interface LibraryTransactionRepository {
  saveImportedBook(data: ImportedBookData): Promise<void>

  deleteBookCompletely(bookId: BookId): Promise<void>
}
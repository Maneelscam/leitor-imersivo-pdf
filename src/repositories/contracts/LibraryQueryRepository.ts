import type { LibraryBookItem } from '@/models/dtos/LibraryBookItem'
import type { BookId } from '@/models/value-objects/BookId'

export interface LibraryQueryRepository {
  findAllItems(): Promise<readonly LibraryBookItem[]>

  findItemByBookId(
    bookId: BookId,
  ): Promise<LibraryBookItem | null>
}
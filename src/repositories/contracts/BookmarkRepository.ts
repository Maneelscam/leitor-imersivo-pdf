import type { Bookmark } from '@/models/entities/Bookmark'
import type { BookmarkId } from '@/models/value-objects/BookmarkId'
import type { BookId } from '@/models/value-objects/BookId'

export interface BookmarkRepository {
  save(bookmark: Bookmark): Promise<void>

  findById(bookmarkId: BookmarkId): Promise<Bookmark | null>

  findByBookId(bookId: BookId): Promise<readonly Bookmark[]>

  findByBookAndPage(
    bookId: BookId,
    pageNumber: number,
  ): Promise<Bookmark | null>

  deleteById(bookmarkId: BookmarkId): Promise<void>

  deleteByBookId(bookId: BookId): Promise<void>
}
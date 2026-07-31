import type {
  BookmarkRepository,
} from '@/repositories/contracts/BookmarkRepository'
import type {
  BookmarkId,
} from '@/models/value-objects/BookmarkId'

export class DeleteBookmarkController {
  constructor(
    private readonly bookmarkRepository:
      BookmarkRepository,
  ) {}

  async execute(
    bookmarkId: BookmarkId,
  ): Promise<void> {
    const existingBookmark =
      await this.bookmarkRepository.findById(
        bookmarkId,
      )

    if (existingBookmark === null) {
      return
    }

    await this.bookmarkRepository.deleteById(
      bookmarkId,
    )
  }
}
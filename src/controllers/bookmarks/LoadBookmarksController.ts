import type {
  Bookmark,
} from '@/models/entities/Bookmark'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  BookmarkRepository,
} from '@/repositories/contracts/BookmarkRepository'

function sortBookmarksByPosition(
  bookmarks: readonly Bookmark[],
): readonly Bookmark[] {
  return [...bookmarks].sort(
    (firstBookmark, secondBookmark) => {
      const pageDifference =
        firstBookmark.pageNumber -
        secondBookmark.pageNumber

      if (pageDifference !== 0) {
        return pageDifference
      }

      const offsetDifference =
        firstBookmark.pageOffsetRatio -
        secondBookmark.pageOffsetRatio

      if (offsetDifference !== 0) {
        return offsetDifference
      }

      return firstBookmark.createdAt.localeCompare(
        secondBookmark.createdAt,
      )
    },
  )
}

export class LoadBookmarksController {
  constructor(
    private readonly bookmarkRepository:
      BookmarkRepository,
  ) {}

  async execute(
    bookId: BookId,
  ): Promise<readonly Bookmark[]> {
    const bookmarks =
      await this.bookmarkRepository.findByBookId(
        bookId,
      )

    return sortBookmarksByPosition(
      bookmarks,
    )
  }
}
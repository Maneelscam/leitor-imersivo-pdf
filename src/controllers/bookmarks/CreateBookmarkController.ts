import type {
  BookmarkRepository,
} from '@/repositories/contracts/BookmarkRepository'
import type {
  Bookmark,
} from '@/models/entities/Bookmark'
import {
  createBookmarkId,
} from '@/models/value-objects/BookmarkId'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import {
  createIsoDateTime,
} from '@/models/value-objects/IsoDateTime'

export interface CreateBookmarkCommand {
  readonly bookId: BookId
  readonly pageNumber: number
  readonly pageOffsetRatio: number
}

function normalizePageNumber(
  pageNumber: number,
): number {
  if (
    !Number.isFinite(pageNumber) ||
    !Number.isInteger(pageNumber) ||
    pageNumber <= 0
  ) {
    throw new Error(
      'Não foi possível criar o favorito porque o número da página é inválido.',
    )
  }

  return pageNumber
}

function normalizePageOffsetRatio(
  pageOffsetRatio: number,
): number {
  if (!Number.isFinite(pageOffsetRatio)) {
    return 0
  }

  return Math.min(
    Math.max(pageOffsetRatio, 0),
    1,
  )
}

export class CreateBookmarkController {
  constructor(
    private readonly bookmarkRepository:
      BookmarkRepository,
  ) {}

  async execute({
    bookId,
    pageNumber,
    pageOffsetRatio,
  }: CreateBookmarkCommand): Promise<Bookmark> {
    const normalizedPageNumber =
      normalizePageNumber(pageNumber)

    const existingBookmark =
      await this.bookmarkRepository
        .findByBookAndPage(
          bookId,
          normalizedPageNumber,
        )

    if (existingBookmark !== null) {
      return existingBookmark
    }

    const bookmark: Bookmark = {
      id: createBookmarkId(),
      bookId,
      pageNumber: normalizedPageNumber,
      pageOffsetRatio:
        normalizePageOffsetRatio(
          pageOffsetRatio,
        ),
      createdAt: createIsoDateTime(),
    }

    await this.bookmarkRepository.save(
      bookmark,
    )

    return bookmark
  }
}
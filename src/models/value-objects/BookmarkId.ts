declare const bookmarkIdBrand: unique symbol

export type BookmarkId = string & {
  readonly [bookmarkIdBrand]: 'BookmarkId'
}

const BOOKMARK_ID_PREFIX = 'bookmark_'

export function createBookmarkId(): BookmarkId {
  return `${BOOKMARK_ID_PREFIX}${crypto.randomUUID()}` as BookmarkId
}

export function parseBookmarkId(value: string): BookmarkId {
  const normalizedValue = value.trim()

  if (!normalizedValue.startsWith(BOOKMARK_ID_PREFIX)) {
    throw new Error('Identificador de favorito inválido.')
  }

  if (normalizedValue.length <= BOOKMARK_ID_PREFIX.length) {
    throw new Error('Identificador de favorito incompleto.')
  }

  return normalizedValue as BookmarkId
}

export function isBookmarkId(value: unknown): value is BookmarkId {
  return (
    typeof value === 'string' &&
    value.startsWith(BOOKMARK_ID_PREFIX) &&
    value.length > BOOKMARK_ID_PREFIX.length
  )
}
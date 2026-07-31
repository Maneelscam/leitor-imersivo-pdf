declare const bookIdBrand: unique symbol

export type BookId = string & {
  readonly [bookIdBrand]: 'BookId'
}

const BOOK_ID_PREFIX = 'book_'

export function createBookId(): BookId {
  return `${BOOK_ID_PREFIX}${crypto.randomUUID()}` as BookId
}

export function parseBookId(value: string): BookId {
  const normalizedValue = value.trim()

  if (!normalizedValue.startsWith(BOOK_ID_PREFIX)) {
    throw new Error('Identificador de livro inválido.')
  }

  if (normalizedValue.length <= BOOK_ID_PREFIX.length) {
    throw new Error('Identificador de livro incompleto.')
  }

  return normalizedValue as BookId
}

export function isBookId(value: unknown): value is BookId {
  return (
    typeof value === 'string' &&
    value.startsWith(BOOK_ID_PREFIX) &&
    value.length > BOOK_ID_PREFIX.length
  )
}
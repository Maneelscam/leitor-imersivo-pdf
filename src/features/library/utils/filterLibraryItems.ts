import type {
  LibraryBookItem,
} from '@/models/dtos/LibraryBookItem'

function normalizeSearchValue(
  value: string,
): string {
  return value
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .trim()
}

export function filterLibraryItems(
  items: readonly LibraryBookItem[],
  query: string,
): readonly LibraryBookItem[] {
  const normalizedQuery =
    normalizeSearchValue(
      query,
    )

  if (normalizedQuery.length === 0) {
    return items
  }

  const searchTerms =
    normalizedQuery.split(' ')

  return items.filter(
    (item) => {
      const searchableContent =
        normalizeSearchValue(
          [
            item.book.title,
            item.book.author ?? '',
            item.book.originalFileName,
          ].join(' '),
        )

      return searchTerms.every(
        (searchTerm) =>
          searchableContent.includes(
            searchTerm,
          ),
      )
    },
  )
}

import type { LibraryBookItem } from '@/models/dtos/LibraryBookItem'
import {
  LibrarySortMode,
  type LibrarySortMode as LibrarySortModeValue,
} from '@/models/enums/LibrarySortMode'
import type { LibraryQueryRepository } from '@/repositories/contracts/LibraryQueryRepository'

export interface LoadLibraryCommand {
  readonly sortMode?: LibrarySortModeValue
}

const titleCollator = new Intl.Collator('pt-BR', {
  sensitivity: 'base',
  numeric: true,
})

function compareTitles(
  firstItem: LibraryBookItem,
  secondItem: LibraryBookItem,
): number {
  return titleCollator.compare(
    firstItem.book.title,
    secondItem.book.title,
  )
}

function compareImportedAtDescending(
  firstItem: LibraryBookItem,
  secondItem: LibraryBookItem,
): number {
  return secondItem.book.importedAt.localeCompare(
    firstItem.book.importedAt,
  )
}

function compareRecentlyOpened(
  firstItem: LibraryBookItem,
  secondItem: LibraryBookItem,
): number {
  const firstLastOpenedAt = firstItem.book.lastOpenedAt
  const secondLastOpenedAt = secondItem.book.lastOpenedAt

  if (
    firstLastOpenedAt !== null &&
    secondLastOpenedAt !== null
  ) {
    const dateComparison = secondLastOpenedAt.localeCompare(
      firstLastOpenedAt,
    )

    if (dateComparison !== 0) {
      return dateComparison
    }

    return compareTitles(firstItem, secondItem)
  }

  if (firstLastOpenedAt !== null) {
    return -1
  }

  if (secondLastOpenedAt !== null) {
    return 1
  }

  const importedAtComparison = compareImportedAtDescending(
    firstItem,
    secondItem,
  )

  if (importedAtComparison !== 0) {
    return importedAtComparison
  }

  return compareTitles(firstItem, secondItem)
}

function sortLibraryItems(
  items: readonly LibraryBookItem[],
  sortMode: LibrarySortModeValue,
): readonly LibraryBookItem[] {
  const sortedItems = [...items]

  switch (sortMode) {
    case LibrarySortMode.RECENTLY_OPENED:
      return sortedItems.sort(compareRecentlyOpened)

    case LibrarySortMode.RECENTLY_IMPORTED:
      return sortedItems.sort((firstItem, secondItem) => {
        const importedAtComparison =
          compareImportedAtDescending(
            firstItem,
            secondItem,
          )

        if (importedAtComparison !== 0) {
          return importedAtComparison
        }

        return compareTitles(firstItem, secondItem)
      })

    case LibrarySortMode.TITLE_ASCENDING:
      return sortedItems.sort(compareTitles)

    case LibrarySortMode.TITLE_DESCENDING:
      return sortedItems.sort(
        (firstItem, secondItem) =>
          compareTitles(secondItem, firstItem),
      )
  }
}

export class LoadLibraryController {
  constructor(
    private readonly libraryQueryRepository:
      LibraryQueryRepository,
  ) {}

  async execute(
    command: LoadLibraryCommand = {},
  ): Promise<readonly LibraryBookItem[]> {
    const items =
      await this.libraryQueryRepository.findAllItems()

    const sortMode =
      command.sortMode ??
      LibrarySortMode.RECENTLY_OPENED

    return sortLibraryItems(items, sortMode)
  }
}
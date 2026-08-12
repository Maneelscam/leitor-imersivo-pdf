import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  LoadLibraryController,
} from '@/controllers/library/LoadLibraryController'
import type {
  LibraryBookItem,
} from '@/models/dtos/LibraryBookItem'
import {
  LibrarySortMode,
} from '@/models/enums/LibrarySortMode'
import type {
  Book,
} from '@/models/entities/Book'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  IsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import type {
  LibraryQueryRepository,
} from '@/repositories/contracts/LibraryQueryRepository'

function createBookItem({
  id,
  title,
  importedAt,
  lastOpenedAt = null,
}: {
  readonly id: string
  readonly title: string
  readonly importedAt: string
  readonly lastOpenedAt?: string | null
}): LibraryBookItem {
  const importedAtValue =
    importedAt as IsoDateTime

  const book: Book = {
    id: id as BookId,
    title,
    author: null,
    originalFileName: `${title}.pdf`,
    fileSizeBytes: 1024,
    mimeType: 'application/pdf',
    totalPages: 100,
    pdfFingerprint: `fingerprint-${id}`,
    importedAt: importedAtValue,
    updatedAt: importedAtValue,
    lastOpenedAt:
      lastOpenedAt === null
        ? null
        : (lastOpenedAt as IsoDateTime),
  }

  return {
    book,
    cover: null,
    readingProgress: null,
  }
}

function createRepository(
  items: readonly LibraryBookItem[],
): LibraryQueryRepository {
  return {
    findAllItems:
      vi.fn().mockResolvedValue(items),

    findItemByBookId:
      vi.fn(),
  }
}

function getBookIds(
  items: readonly LibraryBookItem[],
): readonly BookId[] {
  return items.map(
    (item) => item.book.id,
  )
}

describe(
  'LoadLibraryController',
  () => {
    it(
      'usa recentemente abertos como ordenação padrão',
      async () => {
        const neverOpenedOld =
          createBookItem({
            id: 'never-opened-old',
            title: 'Livro antigo',
            importedAt:
              '2026-01-01T10:00:00.000Z',
          })

        const openedEarlier =
          createBookItem({
            id: 'opened-earlier',
            title: 'Aberto antes',
            importedAt:
              '2026-01-03T10:00:00.000Z',
            lastOpenedAt:
              '2026-02-01T10:00:00.000Z',
          })

        const neverOpenedRecent =
          createBookItem({
            id: 'never-opened-recent',
            title: 'Livro recente',
            importedAt:
              '2026-03-01T10:00:00.000Z',
          })

        const openedLater =
          createBookItem({
            id: 'opened-later',
            title: 'Aberto depois',
            importedAt:
              '2026-01-02T10:00:00.000Z',
            lastOpenedAt:
              '2026-04-01T10:00:00.000Z',
          })

        const repository =
          createRepository([
            neverOpenedOld,
            openedEarlier,
            neverOpenedRecent,
            openedLater,
          ])

        const controller =
          new LoadLibraryController(
            repository,
          )

        const result =
          await controller.execute()

        expect(
          getBookIds(result),
        ).toEqual([
          'opened-later',
          'opened-earlier',
          'never-opened-recent',
          'never-opened-old',
        ])
      },
    )

    it(
      'desempata livros recentemente abertos pelo título',
      async () => {
        const sameDate =
          '2026-05-01T10:00:00.000Z'

        const zebra =
          createBookItem({
            id: 'zebra',
            title: 'Zebra',
            importedAt:
              '2026-01-01T10:00:00.000Z',
            lastOpenedAt: sameDate,
          })

        const arvore =
          createBookItem({
            id: 'arvore',
            title: 'Árvore',
            importedAt:
              '2026-02-01T10:00:00.000Z',
            lastOpenedAt: sameDate,
          })

        const controller =
          new LoadLibraryController(
            createRepository([
              zebra,
              arvore,
            ]),
          )

        const result =
          await controller.execute({
            sortMode:
              LibrarySortMode.RECENTLY_OPENED,
          })

        expect(
          getBookIds(result),
        ).toEqual([
          'arvore',
          'zebra',
        ])
      },
    )

    it(
      'desempata livros nunca abertos pela data de importação e depois pelo título',
      async () => {
        const sameImportedAt =
          '2026-06-01T10:00:00.000Z'

        const older =
          createBookItem({
            id: 'older',
            title: 'Mais antigo',
            importedAt:
              '2026-05-01T10:00:00.000Z',
          })

        const zebra =
          createBookItem({
            id: 'zebra',
            title: 'Zebra',
            importedAt: sameImportedAt,
          })

        const alfa =
          createBookItem({
            id: 'alfa',
            title: 'Alfa',
            importedAt: sameImportedAt,
          })

        const controller =
          new LoadLibraryController(
            createRepository([
              older,
              zebra,
              alfa,
            ]),
          )

        const result =
          await controller.execute({
            sortMode:
              LibrarySortMode.RECENTLY_OPENED,
          })

        expect(
          getBookIds(result),
        ).toEqual([
          'alfa',
          'zebra',
          'older',
        ])
      },
    )

    it(
      'ordena por importação mais recente com desempate por título',
      async () => {
        const sameDate =
          '2026-07-01T10:00:00.000Z'

        const old =
          createBookItem({
            id: 'old',
            title: 'Antigo',
            importedAt:
              '2026-01-01T10:00:00.000Z',
          })

        const beta =
          createBookItem({
            id: 'beta',
            title: 'Beta',
            importedAt: sameDate,
          })

        const alfa =
          createBookItem({
            id: 'alfa',
            title: 'Alfa',
            importedAt: sameDate,
          })

        const controller =
          new LoadLibraryController(
            createRepository([
              old,
              beta,
              alfa,
            ]),
          )

        const result =
          await controller.execute({
            sortMode:
              LibrarySortMode.RECENTLY_IMPORTED,
          })

        expect(
          getBookIds(result),
        ).toEqual([
          'alfa',
          'beta',
          'old',
        ])
      },
    )

    it(
      'ordena títulos em ordem crescente usando comparação pt-BR e numérica',
      async () => {
        const title10 =
          createBookItem({
            id: 'title-10',
            title: 'Livro 10',
            importedAt:
              '2026-01-01T10:00:00.000Z',
          })

        const title2 =
          createBookItem({
            id: 'title-2',
            title: 'Livro 2',
            importedAt:
              '2026-01-01T10:00:00.000Z',
          })

        const arvore =
          createBookItem({
            id: 'arvore',
            title: 'Árvore',
            importedAt:
              '2026-01-01T10:00:00.000Z',
          })

        const controller =
          new LoadLibraryController(
            createRepository([
              title10,
              title2,
              arvore,
            ]),
          )

        const result =
          await controller.execute({
            sortMode:
              LibrarySortMode.TITLE_ASCENDING,
          })

        expect(
          getBookIds(result),
        ).toEqual([
          'arvore',
          'title-2',
          'title-10',
        ])
      },
    )

    it(
      'ordena títulos em ordem decrescente',
      async () => {
        const alfa =
          createBookItem({
            id: 'alfa',
            title: 'Alfa',
            importedAt:
              '2026-01-01T10:00:00.000Z',
          })

        const beta =
          createBookItem({
            id: 'beta',
            title: 'Beta',
            importedAt:
              '2026-01-01T10:00:00.000Z',
          })

        const gama =
          createBookItem({
            id: 'gama',
            title: 'Gama',
            importedAt:
              '2026-01-01T10:00:00.000Z',
          })

        const controller =
          new LoadLibraryController(
            createRepository([
              alfa,
              gama,
              beta,
            ]),
          )

        const result =
          await controller.execute({
            sortMode:
              LibrarySortMode.TITLE_DESCENDING,
          })

        expect(
          getBookIds(result),
        ).toEqual([
          'gama',
          'beta',
          'alfa',
        ])
      },
    )

    it(
      'não altera a ordem do array retornado pelo repositório',
      async () => {
        const first =
          createBookItem({
            id: 'first',
            title: 'Zeta',
            importedAt:
              '2026-01-01T10:00:00.000Z',
          })

        const second =
          createBookItem({
            id: 'second',
            title: 'Alfa',
            importedAt:
              '2026-02-01T10:00:00.000Z',
          })

        const sourceItems = [
          first,
          second,
        ] as const

        const repository =
          createRepository(
            sourceItems,
          )

        const controller =
          new LoadLibraryController(
            repository,
          )

        await controller.execute({
          sortMode:
            LibrarySortMode.TITLE_ASCENDING,
        })

        expect(
          getBookIds(sourceItems),
        ).toEqual([
          'first',
          'second',
        ])
      },
    )
  },
)
import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  getContinueReadingItems,
} from '@/features/library/utils/getContinueReadingItems'
import type {
  LibraryBookItem,
} from '@/models/dtos/LibraryBookItem'

function createItem(
  id: string,
  currentPage: number | null,
  totalPages: number,
  lastOpenedAt: string | null,
  progressUpdatedAt = '2026-01-01T00:00:00.000Z',
  pageOffsetRatio = 0,
): LibraryBookItem {
  return {
    book: {
      id,
      title: `Livro ${id}`,
      author: null,
      originalFileName: `${id}.pdf`,
      fileSizeBytes: 100,
      mimeType: 'application/pdf',
      totalPages,
      pdfFingerprint: null,
      importedAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      lastOpenedAt,
    },
    cover: null,
    readingProgress:
      currentPage === null
        ? null
        : {
            bookId: id,
            currentPage,
            pageOffsetRatio,
            updatedAt: progressUpdatedAt,
          },
  } as LibraryBookItem
}

describe(
  'getContinueReadingItems',
  () => {
    it(
      'mantém apenas livros em andamento',
      () => {
        const items = [
          createItem(
            'nao-iniciado',
            null,
            100,
            null,
          ),
          createItem(
            'em-andamento',
            20,
            100,
            '2026-09-10T10:00:00.000Z',
          ),
          createItem(
            'concluido',
            100,
            100,
            '2026-09-11T10:00:00.000Z',
            '2026-01-01T00:00:00.000Z',
            1,
          ),
        ]

        expect(
          getContinueReadingItems(items)
            .map((item) => item.book.id),
        ).toEqual(['em-andamento'])
      },
    )

    it(
      'ordena pela atividade mais recente',
      () => {
        const items = [
          createItem(
            'antigo',
            20,
            100,
            '2026-09-10T10:00:00.000Z',
          ),
          createItem(
            'recente',
            30,
            100,
            '2026-09-12T10:00:00.000Z',
          ),
          createItem(
            'intermediario',
            40,
            100,
            '2026-09-11T10:00:00.000Z',
          ),
        ]

        expect(
          getContinueReadingItems(items)
            .map((item) => item.book.id),
        ).toEqual([
          'recente',
          'intermediario',
          'antigo',
        ])
      },
    )

    it(
      'usa a atualização do progresso quando não há última abertura',
      () => {
        const items = [
          createItem(
            'mais-antigo',
            10,
            100,
            null,
            '2026-09-10T10:00:00.000Z',
          ),
          createItem(
            'mais-recente',
            20,
            100,
            null,
            '2026-09-12T10:00:00.000Z',
          ),
        ]

        expect(
          getContinueReadingItems(items)
            .map((item) => item.book.id),
        ).toEqual([
          'mais-recente',
          'mais-antigo',
        ])
      },
    )

    it(
      'respeita o limite sem alterar a lista original',
      () => {
        const items = [
          createItem(
            'a',
            10,
            100,
            '2026-09-10T10:00:00.000Z',
          ),
          createItem(
            'b',
            20,
            100,
            '2026-09-12T10:00:00.000Z',
          ),
          createItem(
            'c',
            30,
            100,
            '2026-09-11T10:00:00.000Z',
          ),
        ]

        const originalOrder =
          items.map(
            (item) => item.book.id,
          )

        expect(
          getContinueReadingItems(
            items,
            2,
          ).map(
            (item) => item.book.id,
          ),
        ).toEqual(['b', 'c'])

        expect(
          items.map(
            (item) => item.book.id,
          ),
        ).toEqual(originalOrder)
      },
    )
  },
)

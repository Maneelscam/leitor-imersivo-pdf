import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  getLibraryReadingSummary,
} from '@/features/library/utils/getLibraryReadingSummary'
import type {
  LibraryBookItem,
} from '@/models/dtos/LibraryBookItem'

function createItem(
  id: string,
  currentPage: number | null,
  totalPages: number,
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
      importedAt:
        '2026-01-01T00:00:00.000Z',
      updatedAt:
        '2026-01-01T00:00:00.000Z',
      lastOpenedAt: null,
    },
    cover: null,
    readingProgress:
      currentPage === null
        ? null
        : {
            bookId: id,
            currentPage,
            pageOffsetRatio,
            updatedAt:
              '2026-01-01T00:00:00.000Z',
          },
  } as LibraryBookItem
}

describe(
  'getLibraryReadingSummary',
  () => {
    it(
      'retorna contadores zerados para biblioteca vazia',
      () => {
        expect(
          getLibraryReadingSummary([]),
        ).toEqual({
          total: 0,
          notStarted: 0,
          inProgress: 0,
          completed: 0,
        })
      },
    )

    it(
      'classifica livros por progresso',
      () => {
        const items = [
          createItem(
            'nao-iniciado',
            null,
            100,
          ),
          createItem(
            'em-andamento',
            25,
            100,
          ),
          createItem(
            'concluido',
            100,
            100,
            1,
          ),
        ]

        expect(
          getLibraryReadingSummary(
            items,
          ),
        ).toEqual({
          total: 3,
          notStarted: 1,
          inProgress: 1,
          completed: 1,
        })
      },
    )

    it(
      'considera página 1 offset 0 como não iniciado',
      () => {
        const items = [
          createItem(
            'inicio',
            1,
            100,
            0,
          ),
        ]

        expect(
          getLibraryReadingSummary(
            items,
          ).notStarted,
        ).toBe(1)
      },
    )

    it(
      'considera a última página parcialmente lida como em andamento',
      () => {
        const items = [
          createItem(
            'ultima-pagina',
            100,
            100,
            0.5,
          ),
        ]

        expect(
          getLibraryReadingSummary(
            items,
          ),
        ).toEqual({
          total: 1,
          notStarted: 0,
          inProgress: 1,
          completed: 0,
        })
      },
    )
  },
)

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  filterLibraryItemsByReadingStatus,
} from '@/features/library/utils/filterLibraryItemsByReadingStatus'
import type {
  LibraryBookItem,
} from '@/models/dtos/LibraryBookItem'
import {
  LibraryReadingFilter,
} from '@/models/enums/LibraryReadingFilter'

const TEST_DATE =
  '2026-09-17T12:00:00.000Z' as
    LibraryBookItem['book']['importedAt']

function createLibraryItem(
  id: string,
  currentPage:
    number | null,
  pageOffsetRatio = 0,
): LibraryBookItem {
  return {
    book: {
      id:
        id as
          LibraryBookItem['book']['id'],

      title:
        `Livro ${id}`,

      author:
        null,

      originalFileName:
        `${id}.pdf`,

      fileSizeBytes:
        1024,

      mimeType:
        'application/pdf',

      totalPages:
        10,

      pdfFingerprint:
        null,

      importedAt:
        TEST_DATE,

      updatedAt:
        TEST_DATE,

      lastOpenedAt:
        null,
    },

    cover:
      null,

    readingProgress:
      currentPage === null
        ? null
        : {
            bookId:
              id as
                LibraryBookItem['book']['id'],

            currentPage,

            pageOffsetRatio,

            updatedAt:
              TEST_DATE,
          },
  }
}

const ITEMS:
  readonly LibraryBookItem[] = [
    createLibraryItem(
      'not-started',
      null,
    ),

    createLibraryItem(
      'zero-progress',
      1,
      0,
    ),

    createLibraryItem(
      'in-progress',
      4,
      0.5,
    ),

    createLibraryItem(
      'last-page-in-progress',
      10,
      0.5,
    ),

    createLibraryItem(
      'completed',
      10,
      1,
    ),
  ]

describe(
  'filterLibraryItemsByReadingStatus',
  () => {
    it(
      'mantém a coleção original quando o filtro é todos',
      () => {
        expect(
          filterLibraryItemsByReadingStatus(
            ITEMS,
            LibraryReadingFilter.ALL,
          ),
        ).toBe(
          ITEMS,
        )
      },
    )

    it(
      'filtra documentos ainda não iniciados',
      () => {
        const result =
          filterLibraryItemsByReadingStatus(
            ITEMS,
            LibraryReadingFilter.NOT_STARTED,
          )

        expect(
          result.map(
            (item) =>
              item.book.id,
          ),
        ).toEqual([
          'not-started',
          'zero-progress',
        ])
      },
    )

    it(
      'filtra documentos com leitura em andamento',
      () => {
        const result =
          filterLibraryItemsByReadingStatus(
            ITEMS,
            LibraryReadingFilter.IN_PROGRESS,
          )

        expect(
          result.map(
            (item) =>
              item.book.id,
          ),
        ).toEqual([
          'in-progress',
          'last-page-in-progress',
        ])
      },
    )

    it(
      'considera concluído somente o progresso que chegou a 100%',
      () => {
        const result =
          filterLibraryItemsByReadingStatus(
            ITEMS,
            LibraryReadingFilter.COMPLETED,
          )

        expect(
          result.map(
            (item) =>
              item.book.id,
          ),
        ).toEqual([
          'completed',
        ])
      },
    )
  },
)

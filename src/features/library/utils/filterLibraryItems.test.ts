import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  filterLibraryItems,
} from '@/features/library/utils/filterLibraryItems'
import type {
  LibraryBookItem,
} from '@/models/dtos/LibraryBookItem'

const TEST_DATE =
  '2026-09-17T12:00:00.000Z' as
    LibraryBookItem['book']['importedAt']

function createLibraryItem(
  id: string,
  title: string,
  author: string | null,
  originalFileName: string,
): LibraryBookItem {
  return {
    book: {
      id:
        id as
          LibraryBookItem['book']['id'],

      title,
      author,
      originalFileName,

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
      null,
  }
}

const ITEMS: readonly LibraryBookItem[] = [
  createLibraryItem(
    'book-1',
    'Neuroplasticidade e Educação',
    'Ana Souza',
    'neuroplasticidade.pdf',
  ),

  createLibraryItem(
    'book-2',
    'Aprendendo TypeScript',
    'Carlos Lima',
    'typescript-guia.pdf',
  ),

  createLibraryItem(
    'book-3',
    'Leitura Imersiva',
    null,
    'manual-leitor.pdf',
  ),
]

describe(
  'filterLibraryItems',
  () => {
    it(
      'mantém todos os itens quando a busca está vazia',
      () => {
        expect(
          filterLibraryItems(
            ITEMS,
            '   ',
          ),
        ).toBe(
          ITEMS,
        )
      },
    )

    it(
      'busca por título ignorando acentos e maiúsculas',
      () => {
        const result =
          filterLibraryItems(
            ITEMS,
            'EDUCACAO',
          )

        expect(
          result.map(
            (item) =>
              item.book.id,
          ),
        ).toEqual([
          'book-1',
        ])
      },
    )

    it(
      'busca por autor',
      () => {
        const result =
          filterLibraryItems(
            ITEMS,
            'carlos lima',
          )

        expect(
          result.map(
            (item) =>
              item.book.id,
          ),
        ).toEqual([
          'book-2',
        ])
      },
    )

    it(
      'busca pelo nome original do arquivo',
      () => {
        const result =
          filterLibraryItems(
            ITEMS,
            'manual leitor',
          )

        expect(
          result.map(
            (item) =>
              item.book.id,
          ),
        ).toEqual([
          'book-3',
        ])
      },
    )

    it(
      'aceita múltiplos termos presentes em campos diferentes',
      () => {
        const result =
          filterLibraryItems(
            ITEMS,
            'neuroplasticidade ana',
          )

        expect(
          result.map(
            (item) =>
              item.book.id,
          ),
        ).toEqual([
          'book-1',
        ])
      },
    )

    it(
      'retorna vazio quando nenhum documento corresponde',
      () => {
        expect(
          filterLibraryItems(
            ITEMS,
            'documento inexistente',
          ),
        ).toEqual([])
      },
    )
  },
)

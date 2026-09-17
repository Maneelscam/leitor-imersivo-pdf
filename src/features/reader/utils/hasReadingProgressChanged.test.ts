import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  hasReadingProgressChanged,
} from '@/features/reader/utils/hasReadingProgressChanged'
import type {
  ReadingProgress,
} from '@/models/entities/ReadingProgress'

const SAVED_PROGRESS = {
  bookId:
    'autosave-book',

  currentPage:
    12,

  pageOffsetRatio:
    0.35,

  updatedAt:
    '2026-09-17T12:00:00.000Z',
} as unknown as ReadingProgress

describe(
  'hasReadingProgressChanged',
  () => {
    it(
      'não considera a posição inicial sem progresso como alteração',
      () => {
        expect(
          hasReadingProgressChanged(
            null,
            1,
            0,
          ),
        ).toBe(false)
      },
    )

    it(
      'detecta avanço de página sem progresso salvo',
      () => {
        expect(
          hasReadingProgressChanged(
            null,
            2,
            0,
          ),
        ).toBe(true)
      },
    )

    it(
      'não detecta alteração quando a posição é a mesma',
      () => {
        expect(
          hasReadingProgressChanged(
            SAVED_PROGRESS,
            12,
            0.35,
          ),
        ).toBe(false)
      },
    )

    it(
      'detecta alteração de página',
      () => {
        expect(
          hasReadingProgressChanged(
            SAVED_PROGRESS,
            13,
            0.35,
          ),
        ).toBe(true)
      },
    )

    it(
      'detecta alteração relevante dentro da página',
      () => {
        expect(
          hasReadingProgressChanged(
            SAVED_PROGRESS,
            12,
            0.5,
          ),
        ).toBe(true)
      },
    )

    it(
      'ignora variações mínimas de posição',
      () => {
        expect(
          hasReadingProgressChanged(
            SAVED_PROGRESS,
            12,
            0.3505,
          ),
        ).toBe(false)
      },
    )
  },
)

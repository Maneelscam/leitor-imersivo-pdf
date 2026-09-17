import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  LibraryViewMode,
} from '@/models/enums/LibraryViewMode'
import {
  LibraryViewPreferenceService,
  type LibraryViewPreferenceStorage,
} from '@/services/settings/LibraryViewPreferenceService'

function createStorage(
  initialValue: string | null,
): LibraryViewPreferenceStorage {
  let value = initialValue

  return {
    getItem: vi.fn(() => value),

    setItem: vi.fn(
      (
        _key: string,
        nextValue: string,
      ) => {
        value = nextValue
      },
    ),
  }
}

describe(
  'LibraryViewPreferenceService',
  () => {
    it(
      'usa grade por padrão sem preferência',
      () => {
        const service =
          new LibraryViewPreferenceService(
            createStorage(null),
          )

        expect(service.load()).toBe(
          LibraryViewMode.GRID,
        )
      },
    )

    it(
      'restaura modo lista salvo',
      () => {
        const service =
          new LibraryViewPreferenceService(
            createStorage(
              LibraryViewMode.LIST,
            ),
          )

        expect(service.load()).toBe(
          LibraryViewMode.LIST,
        )
      },
    )

    it(
      'ignora valor inválido',
      () => {
        const service =
          new LibraryViewPreferenceService(
            createStorage('invalido'),
          )

        expect(service.load()).toBe(
          LibraryViewMode.GRID,
        )
      },
    )

    it(
      'salva a preferência',
      () => {
        const storage =
          createStorage(null)

        const service =
          new LibraryViewPreferenceService(
            storage,
          )

        service.save(
          LibraryViewMode.LIST,
        )

        expect(service.load()).toBe(
          LibraryViewMode.LIST,
        )
      },
    )

    it(
      'funciona sem storage',
      () => {
        const service =
          new LibraryViewPreferenceService(
            null,
          )

        expect(service.load()).toBe(
          LibraryViewMode.GRID,
        )

        expect(() => {
          service.save(
            LibraryViewMode.LIST,
          )
        }).not.toThrow()
      },
    )
  },
)

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'

import {
  APP_CONFIG,
} from '@/app/config/app.config'
import {
  closeIndexedDbConnection,
} from '@/database/indexedDbConnection'
import type {
  ReaderSettings,
} from '@/models/entities/ReaderSettings'
import {
  AppTheme,
} from '@/models/enums/AppTheme'
import {
  PageDisplayMode,
} from '@/models/enums/PageDisplayMode'
import {
  ReadingFlowMode,
} from '@/models/enums/ReadingFlowMode'
import {
  ZoomMode,
} from '@/models/enums/ZoomMode'
import type {
  IsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import {
  IndexedDbReaderSettingsRepository,
} from '@/repositories/indexed-db/IndexedDbReaderSettingsRepository'

const TEST_DATE =
  '2026-08-10T17:00:00.000Z' as IsoDateTime

const UPDATED_DATE =
  '2026-08-10T17:30:00.000Z' as IsoDateTime

function deleteTestDatabase():
  Promise<void> {
  closeIndexedDbConnection()

  return new Promise<void>(
    (resolve, reject) => {
      const request =
        indexedDB.deleteDatabase(
          APP_CONFIG.database.name,
        )

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(
          request.error ??
            new Error(
              'Não foi possível excluir o banco de teste.',
            ),
        )
      }

      request.onblocked = () => {
        reject(
          new Error(
            'A exclusão do banco de teste foi bloqueada.',
          ),
        )
      }
    },
  )
}

function createReaderSettings({
  theme =
    AppTheme.DARK,
  pageDisplayMode =
    PageDisplayMode.SINGLE,
  readingFlowMode =
    ReadingFlowMode.PAGINATED,
  zoomMode =
    ZoomMode.FIT_WIDTH,
  customZoomScale = 1,
  enableKeyboardShortcuts = true,
  autoHideReaderControls = false,
  updatedAt = TEST_DATE,
}: {
  readonly theme?: ReaderSettings['theme']
  readonly pageDisplayMode?: ReaderSettings['pageDisplayMode']
  readonly readingFlowMode?: ReaderSettings['readingFlowMode']
  readonly zoomMode?: ReaderSettings['zoomMode']
  readonly customZoomScale?: number
  readonly enableKeyboardShortcuts?: boolean
  readonly autoHideReaderControls?: boolean
  readonly updatedAt?: IsoDateTime
} = {}): ReaderSettings {
  return {
    theme,

    pageDisplayMode,
    readingFlowMode,

    zoomMode,
    customZoomScale,

    enableKeyboardShortcuts,
    autoHideReaderControls,

    updatedAt,
  }
}

describe(
  'IndexedDbReaderSettingsRepository',
  () => {
    beforeEach(
      async () => {
        await deleteTestDatabase()
      },
    )

    afterEach(
      async () => {
        await deleteTestDatabase()
      },
    )

    it(
      'salva e recupera as configurações do leitor',
      async () => {
        const repository =
          new IndexedDbReaderSettingsRepository()

        const settings =
          createReaderSettings()

        await repository.save(
          settings,
        )

        const restoredSettings =
          await repository.find()

        expect(
          restoredSettings,
        ).toEqual(
          settings,
        )
      },
    )

    it(
      'retorna null quando ainda não existem configurações salvas',
      async () => {
        const repository =
          new IndexedDbReaderSettingsRepository()

        const restoredSettings =
          await repository.find()

        expect(
          restoredSettings,
        ).toBeNull()
      },
    )

    it(
      'substitui o registro existente ao salvar novas configurações',
      async () => {
        const repository =
          new IndexedDbReaderSettingsRepository()

        const originalSettings =
          createReaderSettings()

        await repository.save(
          originalSettings,
        )

        const updatedSettings =
          createReaderSettings({
            theme:
              AppTheme.OLED,

            pageDisplayMode:
              PageDisplayMode.DOUBLE,

            readingFlowMode:
              ReadingFlowMode.CONTINUOUS,

            zoomMode:
              ZoomMode.CUSTOM,

            customZoomScale: 1.5,

            enableKeyboardShortcuts:
              false,

            autoHideReaderControls:
              true,

            updatedAt:
              UPDATED_DATE,
          })

        await repository.save(
          updatedSettings,
        )

        const restoredSettings =
          await repository.find()

        expect(
          restoredSettings,
        ).toEqual(
          updatedSettings,
        )
      },
    )

    it(
      'persiste corretamente os diferentes modos de exibição e zoom',
      async () => {
        const repository =
          new IndexedDbReaderSettingsRepository()

        const settings =
          createReaderSettings({
            pageDisplayMode:
              PageDisplayMode.DOUBLE,

            readingFlowMode:
              ReadingFlowMode.PAGINATED,

            zoomMode:
              ZoomMode.FIT_PAGE,

            customZoomScale: 1.25,
          })

        await repository.save(
          settings,
        )

        const restoredSettings =
          await repository.find()

        expect(
          restoredSettings,
        ).toEqual(
          settings,
        )
      },
    )

    it(
      'exclui as configurações salvas',
      async () => {
        const repository =
          new IndexedDbReaderSettingsRepository()

        const settings =
          createReaderSettings()

        await repository.save(
          settings,
        )

        await repository.delete()

        const restoredSettings =
          await repository.find()

        expect(
          restoredSettings,
        ).toBeNull()
      },
    )
  },
)

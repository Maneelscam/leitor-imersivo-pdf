import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { LoadReaderSettingsController } from '@/controllers/settings/LoadReaderSettingsController'
import type { ReaderSettings } from '@/models/entities/ReaderSettings'
import { AppTheme } from '@/models/enums/AppTheme'
import { PageDisplayMode } from '@/models/enums/PageDisplayMode'
import { ReadingFlowMode } from '@/models/enums/ReadingFlowMode'
import { ZoomMode } from '@/models/enums/ZoomMode'
import type { ReaderSettingsRepository } from '@/repositories/contracts/ReaderSettingsRepository'
import type { DefaultReaderSettingsService } from '@/services/settings/DefaultReaderSettingsService'
import {
  ReaderSettingsError,
  ReaderSettingsErrorCode,
} from '@/utils/errors/ReaderSettingsError'

function createSettings(
  overrides: Partial<ReaderSettings> = {},
): ReaderSettings {
  return {
    theme: AppTheme.DARK,

    pageDisplayMode:
      PageDisplayMode.SINGLE,

    readingFlowMode:
      ReadingFlowMode.PAGINATED,

    zoomMode:
      ZoomMode.FIT_WIDTH,

    customZoomScale: 1,

    enableKeyboardShortcuts: true,

    autoHideReaderControls: false,

    updatedAt:
      '2026-08-12T12:00:00.000Z' as ReaderSettings['updatedAt'],

    ...overrides,
  }
}

function createRepository(): ReaderSettingsRepository {
  return {
    save: vi.fn(),
    find: vi.fn(),
    delete: vi.fn(),
  }
}

function createDefaultService(
  settings: ReaderSettings,
): DefaultReaderSettingsService {
  return {
    create:
      vi.fn().mockReturnValue(
        settings,
      ),
  } as unknown as DefaultReaderSettingsService
}

describe(
  'LoadReaderSettingsController',
  () => {
    it(
      'combina as configurações salvas com os padrões atuais',
      async () => {
        const savedSettings =
          createSettings({
            theme:
              AppTheme.OLED,

            pageDisplayMode:
              PageDisplayMode.DOUBLE,

            zoomMode:
              ZoomMode.CUSTOM,

            customZoomScale:
              1.5,
          })

        const defaultSettings =
          createSettings()

        const repository =
          createRepository()

        vi.mocked(
          repository.find,
        ).mockResolvedValue(
          savedSettings,
        )

        const defaultService =
          createDefaultService(
            defaultSettings,
          )

        const controller =
          new LoadReaderSettingsController({
            readerSettingsRepository:
              repository,

            defaultReaderSettingsService:
              defaultService,
          })

        await expect(
          controller.execute(),
        ).resolves.toEqual(
          savedSettings,
        )

        expect(
          repository.find,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          defaultService.create,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      'retorna as configurações padrão quando ainda não existe configuração salva',
      async () => {
        const defaultSettings =
          createSettings()

        const repository =
          createRepository()

        vi.mocked(
          repository.find,
        ).mockResolvedValue(
          null,
        )

        const defaultService =
          createDefaultService(
            defaultSettings,
          )

        const controller =
          new LoadReaderSettingsController({
            readerSettingsRepository:
              repository,

            defaultReaderSettingsService:
              defaultService,
          })

        await expect(
          controller.execute(),
        ).resolves.toBe(
          defaultSettings,
        )

        expect(
          repository.find,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          defaultService.create,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      'adiciona o tema padrão a uma configuração antiga que ainda não possui theme',
      async () => {
        const defaultSettings =
          createSettings({
            theme:
              AppTheme.DARK,
          })

        const legacySettings = {
          pageDisplayMode:
            PageDisplayMode.DOUBLE,

          readingFlowMode:
            ReadingFlowMode.PAGINATED,

          zoomMode:
            ZoomMode.CUSTOM,

          customZoomScale:
            1.4,

          enableKeyboardShortcuts:
            false,

          autoHideReaderControls:
            true,

          updatedAt:
            '2026-08-10T10:00:00.000Z',
        } as unknown as ReaderSettings

        const repository =
          createRepository()

        vi.mocked(
          repository.find,
        ).mockResolvedValue(
          legacySettings,
        )

        const defaultService =
          createDefaultService(
            defaultSettings,
          )

        const controller =
          new LoadReaderSettingsController({
            readerSettingsRepository:
              repository,

            defaultReaderSettingsService:
              defaultService,
          })

        await expect(
          controller.execute(),
        ).resolves.toMatchObject({
          theme:
            AppTheme.DARK,

          pageDisplayMode:
            PageDisplayMode.DOUBLE,

          zoomMode:
            ZoomMode.CUSTOM,

          customZoomScale:
            1.4,

          enableKeyboardShortcuts:
            false,

          autoHideReaderControls:
            true,
        })
      },
    )

    it(
      'substitui um tema salvo inválido pelo tema padrão',
      async () => {
        const defaultSettings =
          createSettings({
            theme:
              AppTheme.DARK,
          })

        const invalidSettings = {
          ...createSettings(),
          theme:
            'neon-invalido',
        } as unknown as ReaderSettings

        const repository =
          createRepository()

        vi.mocked(
          repository.find,
        ).mockResolvedValue(
          invalidSettings,
        )

        const defaultService =
          createDefaultService(
            defaultSettings,
          )

        const controller =
          new LoadReaderSettingsController({
            readerSettingsRepository:
              repository,

            defaultReaderSettingsService:
              defaultService,
          })

        await expect(
          controller.execute(),
        ).resolves.toMatchObject({
          theme:
            AppTheme.DARK,
        })
      },
    )

    it(
      'converte falha do repositório em LOAD_FAILED preservando a causa',
      async () => {
        const repositoryError =
          new Error(
            'falha ao carregar',
          )

        const repository =
          createRepository()

        vi.mocked(
          repository.find,
        ).mockRejectedValue(
          repositoryError,
        )

        const defaultService =
          createDefaultService(
            createSettings(),
          )

        const controller =
          new LoadReaderSettingsController({
            readerSettingsRepository:
              repository,

            defaultReaderSettingsService:
              defaultService,
          })

        try {
          await controller.execute()

          throw new Error(
            'O carregamento deveria falhar.',
          )
        } catch (error) {
          expect(
            error,
          ).toBeInstanceOf(
            ReaderSettingsError,
          )

          expect(
            error,
          ).toMatchObject({
            code:
              ReaderSettingsErrorCode.LOAD_FAILED,

            cause:
              repositoryError,
          })
        }

        expect(
          defaultService.create,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      'converte falha ao criar os padrões em LOAD_FAILED e não consulta o repositório',
      async () => {
        const defaultError =
          new Error(
            'falha ao criar padrões',
          )

        const repository =
          createRepository()

        const defaultService = {
          create:
            vi.fn(
              () => {
                throw defaultError
              },
            ),
        } as unknown as DefaultReaderSettingsService

        const controller =
          new LoadReaderSettingsController({
            readerSettingsRepository:
              repository,

            defaultReaderSettingsService:
              defaultService,
          })

        await expect(
          controller.execute(),
        ).rejects.toMatchObject({
          name:
            'ReaderSettingsError',

          code:
            ReaderSettingsErrorCode.LOAD_FAILED,

          cause:
            defaultError,
        })

        expect(
          repository.find,
        ).not.toHaveBeenCalled()
      },
    )
  },
)
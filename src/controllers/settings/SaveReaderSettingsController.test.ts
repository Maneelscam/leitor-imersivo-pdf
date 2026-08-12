import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { READER_SETTINGS_CONFIG } from '@/app/config/readerSettings.config'
import {
  SaveReaderSettingsController,
  type SaveReaderSettingsCommand,
} from '@/controllers/settings/SaveReaderSettingsController'
import { PageDisplayMode } from '@/models/enums/PageDisplayMode'
import { ReadingFlowMode } from '@/models/enums/ReadingFlowMode'
import { ZoomMode } from '@/models/enums/ZoomMode'
import type { ReaderSettingsRepository } from '@/repositories/contracts/ReaderSettingsRepository'
import {
  ReaderSettingsError,
  ReaderSettingsErrorCode,
} from '@/utils/errors/ReaderSettingsError'

function createRepository(): ReaderSettingsRepository {
  return {
    save: vi.fn(),
    find: vi.fn(),
    delete: vi.fn(),
  }
}

function createCommand(
  overrides: Partial<SaveReaderSettingsCommand> = {},
): SaveReaderSettingsCommand {
  return {
    pageDisplayMode:
      PageDisplayMode.DOUBLE,
    readingFlowMode:
      ReadingFlowMode.PAGINATED,
    zoomMode:
      ZoomMode.CUSTOM,
    customZoomScale:
      1.5,
    enableKeyboardShortcuts:
      false,
    autoHideReaderControls:
      true,
    ...overrides,
  }
}

describe('SaveReaderSettingsController', () => {
  const fixedDate =
    new Date('2026-08-12T12:00:00.000Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(fixedDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('valida, persiste e retorna as configurações informadas com updatedAt atual', async () => {
    const repository =
      createRepository()

    vi.mocked(
      repository.save,
    ).mockResolvedValue(
      undefined,
    )

    const controller =
      new SaveReaderSettingsController(
        repository,
      )

    const command =
      createCommand()

    const settings =
      await controller.execute(
        command,
      )

    expect(settings).toEqual({
      ...command,
      updatedAt:
        fixedDate.toISOString(),
    })

    expect(
      repository.save,
    ).toHaveBeenCalledTimes(
      1,
    )

    expect(
      repository.save,
    ).toHaveBeenCalledWith(
      settings,
    )
  })

  it.each([
    [
      'pageDisplayMode',
      'triple',
      ReaderSettingsErrorCode.INVALID_PAGE_DISPLAY_MODE,
    ],
    [
      'readingFlowMode',
      'book',
      ReaderSettingsErrorCode.INVALID_READING_FLOW_MODE,
    ],
    [
      'zoomMode',
      'automatic',
      ReaderSettingsErrorCode.INVALID_ZOOM_MODE,
    ],
  ] as const)(
    'rejeita %s inválido antes de acessar o repositório',
    async (
      property,
      invalidValue,
      expectedCode,
    ) => {
      const repository =
        createRepository()

      const controller =
        new SaveReaderSettingsController(
          repository,
        )

      const command = {
        ...createCommand(),
        [property]:
          invalidValue,
      } as unknown as SaveReaderSettingsCommand

      await expect(
        controller.execute(
          command,
        ),
      ).rejects.toMatchObject({
        name:
          'ReaderSettingsError',
        code:
          expectedCode,
      })

      expect(
        repository.save,
      ).not.toHaveBeenCalled()
    },
  )

  it.each([
    [
      READER_SETTINGS_CONFIG.zoom.minimumScale - 0.01,
    ],
    [
      READER_SETTINGS_CONFIG.zoom.maximumScale + 0.01,
    ],
    [
      Number.NaN,
    ],
    [
      Number.POSITIVE_INFINITY,
    ],
    [
      Number.NEGATIVE_INFINITY,
    ],
  ])(
    'rejeita escala de zoom inválida: %s',
    async (
      customZoomScale,
    ) => {
      const repository =
        createRepository()

      const controller =
        new SaveReaderSettingsController(
          repository,
        )

      await expect(
        controller.execute(
          createCommand({
            customZoomScale,
          }),
        ),
      ).rejects.toMatchObject({
        name:
          'ReaderSettingsError',
        code:
          ReaderSettingsErrorCode.INVALID_ZOOM_SCALE,
      })

      expect(
        repository.save,
      ).not.toHaveBeenCalled()
    },
  )

  it.each([
    READER_SETTINGS_CONFIG.zoom.minimumScale,
    READER_SETTINGS_CONFIG.zoom.maximumScale,
  ])(
    'aceita o limite de zoom %s',
    async (
      customZoomScale,
    ) => {
      const repository =
        createRepository()

      vi.mocked(
        repository.save,
      ).mockResolvedValue(
        undefined,
      )

      const controller =
        new SaveReaderSettingsController(
          repository,
        )

      await expect(
        controller.execute(
          createCommand({
            customZoomScale,
          }),
        ),
      ).resolves.toMatchObject({
        customZoomScale,
      })

      expect(
        repository.save,
      ).toHaveBeenCalledTimes(
        1,
      )
    },
  )

  it('converte falha do repositório em SAVE_FAILED preservando a causa', async () => {
    const repositoryError =
      new Error(
        'falha ao salvar',
      )

    const repository =
      createRepository()

    vi.mocked(
      repository.save,
    ).mockRejectedValue(
      repositoryError,
    )

    const controller =
      new SaveReaderSettingsController(
        repository,
      )

    try {
      await controller.execute(
        createCommand(),
      )

      throw new Error(
        'O salvamento deveria falhar.',
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
          ReaderSettingsErrorCode.SAVE_FAILED,
        cause:
          repositoryError,
      })
    }
  })
})

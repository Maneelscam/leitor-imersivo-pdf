import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { ResetReaderSettingsController } from '@/controllers/settings/ResetReaderSettingsController'
import { PageDisplayMode } from '@/models/enums/PageDisplayMode'
import { ReadingFlowMode } from '@/models/enums/ReadingFlowMode'
import { ZoomMode } from '@/models/enums/ZoomMode'
import type { ReaderSettings } from '@/models/entities/ReaderSettings'
import type { ReaderSettingsRepository } from '@/repositories/contracts/ReaderSettingsRepository'
import type { DefaultReaderSettingsService } from '@/services/settings/DefaultReaderSettingsService'
import {
  ReaderSettingsError,
  ReaderSettingsErrorCode,
} from '@/utils/errors/ReaderSettingsError'

function createSettings(): ReaderSettings {
  return {
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
  }
}

function createRepository(): ReaderSettingsRepository {
  return {
    save: vi.fn(),
    find: vi.fn(),
    delete: vi.fn(),
  }
}

describe('ResetReaderSettingsController', () => {
  it('remove as configurações salvas e retorna um novo conjunto padrão', async () => {
    const defaultSettings =
      createSettings()

    const repository =
      createRepository()

    vi.mocked(
      repository.delete,
    ).mockResolvedValue(
      undefined,
    )

    const defaultService = {
      create:
        vi.fn().mockReturnValue(
          defaultSettings,
        ),
    } as unknown as DefaultReaderSettingsService

    const controller =
      new ResetReaderSettingsController({
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
      repository.delete,
    ).toHaveBeenCalledTimes(
      1,
    )

    expect(
      defaultService.create,
    ).toHaveBeenCalledTimes(
      1,
    )
  })

  it('converte falha ao excluir as configurações em RESET_FAILED preservando a causa', async () => {
    const repositoryError =
      new Error(
        'falha ao excluir',
      )

    const repository =
      createRepository()

    vi.mocked(
      repository.delete,
    ).mockRejectedValue(
      repositoryError,
    )

    const defaultService = {
      create:
        vi.fn().mockReturnValue(
          createSettings(),
        ),
    } as unknown as DefaultReaderSettingsService

    const controller =
      new ResetReaderSettingsController({
        readerSettingsRepository:
          repository,
        defaultReaderSettingsService:
          defaultService,
      })

    try {
      await controller.execute()

      throw new Error(
        'A restauração deveria falhar.',
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
          ReaderSettingsErrorCode.RESET_FAILED,
        cause:
          repositoryError,
      })
    }

    expect(
      defaultService.create,
    ).not.toHaveBeenCalled()
  })

  it('propaga a falha do serviço padrão depois de excluir as configurações', async () => {
    const defaultError =
      new Error(
        'falha ao criar padrões',
      )

    const repository =
      createRepository()

    vi.mocked(
      repository.delete,
    ).mockResolvedValue(
      undefined,
    )

    const defaultService = {
      create:
        vi.fn(
          () => {
            throw defaultError
          },
        ),
    } as unknown as DefaultReaderSettingsService

    const controller =
      new ResetReaderSettingsController({
        readerSettingsRepository:
          repository,
        defaultReaderSettingsService:
          defaultService,
      })

    await expect(
      controller.execute(),
    ).rejects.toBe(
      defaultError,
    )

    expect(
      repository.delete,
    ).toHaveBeenCalledTimes(
      1,
    )
  })
})

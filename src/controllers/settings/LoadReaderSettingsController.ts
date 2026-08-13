import type { ReaderSettings } from '@/models/entities/ReaderSettings'
import { isAppTheme } from '@/models/enums/AppTheme'
import type { ReaderSettingsRepository } from '@/repositories/contracts/ReaderSettingsRepository'
import type { DefaultReaderSettingsService } from '@/services/settings/DefaultReaderSettingsService'
import {
  ReaderSettingsError,
  ReaderSettingsErrorCode,
} from '@/utils/errors/ReaderSettingsError'

export interface LoadReaderSettingsControllerDependencies {
  readonly readerSettingsRepository: ReaderSettingsRepository
  readonly defaultReaderSettingsService: DefaultReaderSettingsService
}

export class LoadReaderSettingsController {
  constructor(
    private readonly dependencies:
      LoadReaderSettingsControllerDependencies,
  ) {}

  async execute(): Promise<ReaderSettings> {
    const {
      readerSettingsRepository,
      defaultReaderSettingsService,
    } = this.dependencies

    try {
      const defaultSettings =
        defaultReaderSettingsService.create()

      const savedSettings =
        await readerSettingsRepository.find()

      if (savedSettings === null) {
        return defaultSettings
      }

      return {
        ...defaultSettings,
        ...savedSettings,

        theme: isAppTheme(savedSettings.theme)
          ? savedSettings.theme
          : defaultSettings.theme,
      }
    } catch (error) {
      throw new ReaderSettingsError(
        ReaderSettingsErrorCode.LOAD_FAILED,
        'Não foi possível carregar as configurações do leitor.',
        {
          cause: error,
        },
      )
    }
  }
}
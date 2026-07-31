import type { ReaderSettings } from '@/models/entities/ReaderSettings'
import type { ReaderSettingsRepository } from '@/repositories/contracts/ReaderSettingsRepository'
import type { DefaultReaderSettingsService } from '@/services/settings/DefaultReaderSettingsService'
import {
  ReaderSettingsError,
  ReaderSettingsErrorCode,
} from '@/utils/errors/ReaderSettingsError'

export interface ResetReaderSettingsControllerDependencies {
  readonly readerSettingsRepository: ReaderSettingsRepository
  readonly defaultReaderSettingsService: DefaultReaderSettingsService
}

export class ResetReaderSettingsController {
  constructor(
    private readonly dependencies:
      ResetReaderSettingsControllerDependencies,
  ) {}

  async execute(): Promise<ReaderSettings> {
    const {
      readerSettingsRepository,
      defaultReaderSettingsService,
    } = this.dependencies

    try {
      await readerSettingsRepository.delete()
    } catch (error) {
      throw new ReaderSettingsError(
        ReaderSettingsErrorCode.RESET_FAILED,
        'Não foi possível restaurar as configurações padrão do leitor.',
        {
          cause: error,
        },
      )
    }

    return defaultReaderSettingsService.create()
  }
}
import { READER_SETTINGS_CONFIG } from '@/app/config/readerSettings.config'
import type { ReaderSettings } from '@/models/entities/ReaderSettings'
import {
  isPageDisplayMode,
  type PageDisplayMode,
} from '@/models/enums/PageDisplayMode'
import {
  isReadingFlowMode,
  type ReadingFlowMode,
} from '@/models/enums/ReadingFlowMode'
import {
  isZoomMode,
  type ZoomMode,
} from '@/models/enums/ZoomMode'
import { createIsoDateTime } from '@/models/value-objects/IsoDateTime'
import type { ReaderSettingsRepository } from '@/repositories/contracts/ReaderSettingsRepository'
import {
  ReaderSettingsError,
  ReaderSettingsErrorCode,
} from '@/utils/errors/ReaderSettingsError'

export interface SaveReaderSettingsCommand {
  readonly pageDisplayMode: PageDisplayMode
  readonly readingFlowMode: ReadingFlowMode

  readonly zoomMode: ZoomMode
  readonly customZoomScale: number

  readonly enableKeyboardShortcuts: boolean
  readonly autoHideReaderControls: boolean
}

function validatePageDisplayMode(
  pageDisplayMode: unknown,
): asserts pageDisplayMode is PageDisplayMode {
  if (!isPageDisplayMode(pageDisplayMode)) {
    throw new ReaderSettingsError(
      ReaderSettingsErrorCode.INVALID_PAGE_DISPLAY_MODE,
      'O modo de exibição de páginas informado é inválido.',
    )
  }
}

function validateReadingFlowMode(
  readingFlowMode: unknown,
): asserts readingFlowMode is ReadingFlowMode {
  if (!isReadingFlowMode(readingFlowMode)) {
    throw new ReaderSettingsError(
      ReaderSettingsErrorCode.INVALID_READING_FLOW_MODE,
      'O modo de navegação informado é inválido.',
    )
  }
}

function validateZoomMode(
  zoomMode: unknown,
): asserts zoomMode is ZoomMode {
  if (!isZoomMode(zoomMode)) {
    throw new ReaderSettingsError(
      ReaderSettingsErrorCode.INVALID_ZOOM_MODE,
      'O modo de zoom informado é inválido.',
    )
  }
}

function validateCustomZoomScale(
  customZoomScale: number,
): void {
  const { minimumScale, maximumScale } =
    READER_SETTINGS_CONFIG.zoom

  if (
    !Number.isFinite(customZoomScale) ||
    customZoomScale < minimumScale ||
    customZoomScale > maximumScale
  ) {
    throw new ReaderSettingsError(
      ReaderSettingsErrorCode.INVALID_ZOOM_SCALE,
      `O zoom deve estar entre ${minimumScale * 100}% e ${
        maximumScale * 100
      }%.`,
    )
  }
}

export class SaveReaderSettingsController {
  constructor(
    private readonly readerSettingsRepository:
      ReaderSettingsRepository,
  ) {}

  async execute(
    command: SaveReaderSettingsCommand,
  ): Promise<ReaderSettings> {
    validatePageDisplayMode(command.pageDisplayMode)
    validateReadingFlowMode(command.readingFlowMode)
    validateZoomMode(command.zoomMode)
    validateCustomZoomScale(command.customZoomScale)

    const settings: ReaderSettings = {
      pageDisplayMode: command.pageDisplayMode,
      readingFlowMode: command.readingFlowMode,
      zoomMode: command.zoomMode,
      customZoomScale: command.customZoomScale,
      enableKeyboardShortcuts:
        command.enableKeyboardShortcuts,
      autoHideReaderControls:
        command.autoHideReaderControls,
      updatedAt: createIsoDateTime(),
    }

    try {
      await this.readerSettingsRepository.save(settings)
    } catch (error) {
      throw new ReaderSettingsError(
        ReaderSettingsErrorCode.SAVE_FAILED,
        'Não foi possível salvar as configurações do leitor.',
        {
          cause: error,
        },
      )
    }

    return settings
  }
}
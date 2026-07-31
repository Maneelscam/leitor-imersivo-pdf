import { READER_SETTINGS_CONFIG } from '@/app/config/readerSettings.config'
import type { ReaderSettings } from '@/models/entities/ReaderSettings'
import { createIsoDateTime } from '@/models/value-objects/IsoDateTime'

export class DefaultReaderSettingsService {
  create(): ReaderSettings {
    const { defaults } = READER_SETTINGS_CONFIG

    return {
      pageDisplayMode: defaults.pageDisplayMode,
      readingFlowMode: defaults.readingFlowMode,
      zoomMode: defaults.zoomMode,
      customZoomScale: defaults.customZoomScale,
      enableKeyboardShortcuts:
        defaults.enableKeyboardShortcuts,
      autoHideReaderControls:
        defaults.autoHideReaderControls,
      updatedAt: createIsoDateTime(),
    }
  }
}
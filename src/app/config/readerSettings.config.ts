import { AppTheme } from '@/models/enums/AppTheme'
import { PageDisplayMode } from '@/models/enums/PageDisplayMode'
import { ReadingFlowMode } from '@/models/enums/ReadingFlowMode'
import { ZoomMode } from '@/models/enums/ZoomMode'

export const READER_SETTINGS_CONFIG = {
  defaults: {
    theme: AppTheme.DARK,

    pageDisplayMode: PageDisplayMode.SINGLE,
    readingFlowMode: ReadingFlowMode.PAGINATED,

    zoomMode: ZoomMode.FIT_WIDTH,
    customZoomScale: 1,

    enableKeyboardShortcuts: true,
    autoHideReaderControls: false,
  },

  zoom: {
    minimumScale: 0.5,
    maximumScale: 3,
    step: 0.1,
  },
} as const
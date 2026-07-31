import type { PageDisplayMode } from '@/models/enums/PageDisplayMode'
import type { ReadingFlowMode } from '@/models/enums/ReadingFlowMode'
import type { ZoomMode } from '@/models/enums/ZoomMode'
import type { IsoDateTime } from '@/models/value-objects/IsoDateTime'

export interface ReaderSettings {
  readonly pageDisplayMode: PageDisplayMode
  readonly readingFlowMode: ReadingFlowMode

  readonly zoomMode: ZoomMode
  readonly customZoomScale: number

  readonly enableKeyboardShortcuts: boolean
  readonly autoHideReaderControls: boolean

  readonly updatedAt: IsoDateTime
}
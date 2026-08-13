import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { READER_SETTINGS_CONFIG } from '@/app/config/readerSettings.config'
import { DefaultReaderSettingsService } from '@/services/settings/DefaultReaderSettingsService'

describe('DefaultReaderSettingsService', () => {
  const fixedDate =
    new Date('2026-08-12T12:00:00.000Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(fixedDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('cria as configurações padrão definidas na configuração da aplicação', () => {
    const service =
      new DefaultReaderSettingsService()

    const settings =
      service.create()

    expect(settings).toEqual({
      theme:
        READER_SETTINGS_CONFIG.defaults.theme,

      pageDisplayMode:
        READER_SETTINGS_CONFIG.defaults.pageDisplayMode,

      readingFlowMode:
        READER_SETTINGS_CONFIG.defaults.readingFlowMode,

      zoomMode:
        READER_SETTINGS_CONFIG.defaults.zoomMode,

      customZoomScale:
        READER_SETTINGS_CONFIG.defaults.customZoomScale,

      enableKeyboardShortcuts:
        READER_SETTINGS_CONFIG.defaults.enableKeyboardShortcuts,

      autoHideReaderControls:
        READER_SETTINGS_CONFIG.defaults.autoHideReaderControls,

      updatedAt:
        fixedDate.toISOString(),
    })
  })

  it('cria uma nova instância de configurações a cada chamada', () => {
    const service =
      new DefaultReaderSettingsService()

    const first =
      service.create()

    const second =
      service.create()

    expect(first).not.toBe(second)
    expect(first).toEqual(second)
  })
})
import {
  READER_SETTINGS_CONFIG,
} from '@/app/config/readerSettings.config'
import {
  isAppTheme,
  type AppTheme,
} from '@/models/enums/AppTheme'

const APP_THEME_STORAGE_KEY =
  'leitor-imersivo-pdf:app-theme'

function canUseDocument(): boolean {
  return typeof document !== 'undefined'
}

function canUseLocalStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

export class AppThemeService {
  getDefaultTheme(): AppTheme {
    return READER_SETTINGS_CONFIG.defaults.theme
  }

  readCachedTheme(): AppTheme {
    if (!canUseLocalStorage()) {
      return this.getDefaultTheme()
    }

    try {
      const cachedTheme =
        localStorage.getItem(
          APP_THEME_STORAGE_KEY,
        )

      return isAppTheme(cachedTheme)
        ? cachedTheme
        : this.getDefaultTheme()
    } catch {
      return this.getDefaultTheme()
    }
  }

  applyTheme(
    theme: AppTheme,
  ): void {
    if (!canUseDocument()) {
      return
    }

    document.documentElement.dataset.theme =
      theme
  }

  cacheTheme(
    theme: AppTheme,
  ): void {
    if (!canUseLocalStorage()) {
      return
    }

    try {
      localStorage.setItem(
        APP_THEME_STORAGE_KEY,
        theme,
      )
    } catch {
      // O cache serve apenas para evitar
      // flash visual durante a inicialização.
      // A fonte oficial continua sendo o IndexedDB.
    }
  }

  synchronizeTheme(
    theme: AppTheme,
  ): void {
    this.applyTheme(theme)
    this.cacheTheme(theme)
  }

  initializeFromCache(): AppTheme {
    const theme =
      this.readCachedTheme() 

    this.applyTheme(theme)

    return theme
  }
}

export const appThemeService =
  new AppThemeService()
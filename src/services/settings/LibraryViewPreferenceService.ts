import {
  LibraryViewMode,
  isLibraryViewMode,
  type LibraryViewMode as LibraryViewModeValue,
} from '@/models/enums/LibraryViewMode'

export interface LibraryViewPreferenceStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

const STORAGE_KEY =
  'leitor-imersivo-pdf:library-view-mode'

export class LibraryViewPreferenceService {
  constructor(
    private readonly storage:
      LibraryViewPreferenceStorage | null,
  ) {}

  load(): LibraryViewModeValue {
    if (this.storage === null) {
      return LibraryViewMode.GRID
    }

    try {
      const storedValue =
        this.storage.getItem(STORAGE_KEY)

      return storedValue !== null &&
        isLibraryViewMode(storedValue)
        ? storedValue
        : LibraryViewMode.GRID
    } catch {
      return LibraryViewMode.GRID
    }
  }

  save(viewMode: LibraryViewModeValue): void {
    if (this.storage === null) {
      return
    }

    try {
      this.storage.setItem(
        STORAGE_KEY,
        viewMode,
      )
    } catch {
      // Preferência visual não deve impedir o uso.
    }
  }
}

function createBrowserStorage():
  LibraryViewPreferenceStorage | null {
  if (
    typeof window === 'undefined' ||
    window.localStorage === undefined
  ) {
    return null
  }

  return window.localStorage
}

export const libraryViewPreferenceService =
  new LibraryViewPreferenceService(
    createBrowserStorage(),
  )

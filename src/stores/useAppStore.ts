import {
  create,
} from 'zustand'

import type {
  AppStore,
} from '@/stores/appStore.types'
import {
  createAnnotationSlice,
} from '@/stores/slices/createAnnotationSlice'
import {
  createLibraryBackupSlice,
} from '@/stores/slices/createLibraryBackupSlice'
import {
  createLibrarySlice,
} from '@/stores/slices/createLibrarySlice'
import {
  createPdfTextSearchSlice,
} from '@/stores/slices/createPdfTextSearchSlice'
import {
  createReaderSettingsSlice,
} from '@/stores/slices/createReaderSettingsSlice'
import {
  createReaderSlice,
} from '@/stores/slices/createReaderSlice'

export const useAppStore =
  create<AppStore>()(
    (...storeArguments) => ({
      ...createLibrarySlice(
        ...storeArguments,
      ),

      ...createLibraryBackupSlice(
        ...storeArguments,
      ),

      ...createReaderSlice(
        ...storeArguments,
      ),

      ...createAnnotationSlice(
        ...storeArguments,
      ),

      ...createPdfTextSearchSlice(
        ...storeArguments,
      ),

      ...createReaderSettingsSlice(
        ...storeArguments,
      ),
    }),
  )
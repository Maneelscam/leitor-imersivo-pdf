import {
  AppRoute,
} from '@/app/routes/AppRoute'
import {
  useAppRoute,
} from '@/app/routes/useAppRoute'
import {
  LibraryPage,
} from '@/pages/library/LibraryPage'
import {
  ReaderPage,
} from '@/pages/reader/ReaderPage'
import {
  SettingsPage,
} from '@/pages/settings/SettingsPage'

export function AppRouter() {
  const currentRoute = useAppRoute()

  switch (currentRoute) {
    case AppRoute.LIBRARY:
      return <LibraryPage />

    case AppRoute.READER:
      return <ReaderPage />

    case AppRoute.SETTINGS:
      return <SettingsPage />
  }
}
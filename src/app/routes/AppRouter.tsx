import {
  lazy,
  Suspense,
  type ReactNode,
} from 'react'

import {
  AppRoute,
} from '@/app/routes/AppRoute'
import {
  useAppRoute,
} from '@/app/routes/useAppRoute'
import {
  LoadingIndicator,
  LoadingIndicatorSize,
} from '@/components/feedback/LoadingIndicator'

const LazyLibraryPage =
  lazy(
    async () => {
      const module =
        await import(
          '@/pages/library/LibraryPage'
        )

      return {
        default:
          module.LibraryPage,
      }
    },
  )

const LazyReaderPage =
  lazy(
    async () => {
      const module =
        await import(
          '@/pages/reader/ReaderPage'
        )

      return {
        default:
          module.ReaderPage,
      }
    },
  )

const LazySettingsPage =
  lazy(
    async () => {
      const module =
        await import(
          '@/pages/settings/SettingsPage'
        )

      return {
        default:
          module.SettingsPage,
      }
    },
  )

function RouteLoadingFallback() {
  return (
    <LoadingIndicator
      size={
        LoadingIndicatorSize.LARGE
      }
      label="Carregando..."
      vertical
      fullArea
    />
  )
}

function resolveRouteContent(
  currentRoute: AppRoute,
): ReactNode {
  switch (currentRoute) {
    case AppRoute.LIBRARY:
      return <LazyLibraryPage />

    case AppRoute.READER:
      return <LazyReaderPage />

    case AppRoute.SETTINGS:
      return <LazySettingsPage />
  }
}

export function AppRouter() {
  const currentRoute =
    useAppRoute()

  return (
    <Suspense
      fallback={
        <RouteLoadingFallback />
      }
    >
      {resolveRouteContent(
        currentRoute,
      )}
    </Suspense>
  )
}
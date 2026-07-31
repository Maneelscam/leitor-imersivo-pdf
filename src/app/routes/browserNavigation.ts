import {
  AppRoute,
  normalizeAppRoute,
} from '@/app/routes/AppRoute'

export type AppRouteListener = (
  route: AppRoute,
) => void

export interface NavigateToAppRouteOptions {
  readonly replace?: boolean
}

const routeListeners = new Set<AppRouteListener>()

let isBrowserListenerConfigured = false
let isNotificationScheduled = false

function ensureBrowserIsAvailable(): boolean {
  return typeof window !== 'undefined'
}

function extractPathFromHash(hash: string): string {
  const hashContent = hash.startsWith('#')
    ? hash.slice(1)
    : hash

  const querySeparatorIndex =
    hashContent.indexOf('?')

  const pathname =
    querySeparatorIndex >= 0
      ? hashContent.slice(0, querySeparatorIndex)
      : hashContent

  return pathname.length > 0
    ? pathname
    : AppRoute.LIBRARY
}

function createHashForRoute(route: AppRoute): string {
  return `#${route}`
}

function notifyRouteListeners(): void {
  const currentRoute = getCurrentAppRoute()

  for (const listener of routeListeners) {
    listener(currentRoute)
  }
}

function scheduleRouteNotification(): void {
  if (isNotificationScheduled) {
    return
  }

  isNotificationScheduled = true

  queueMicrotask(() => {
    isNotificationScheduled = false
    notifyRouteListeners()
  })
}

function handleBrowserNavigation(): void {
  scheduleRouteNotification()
}

function configureBrowserListeners(): void {
  if (
    !ensureBrowserIsAvailable() ||
    isBrowserListenerConfigured
  ) {
    return
  }

  window.addEventListener(
    'popstate',
    handleBrowserNavigation,
  )

  window.addEventListener(
    'hashchange',
    handleBrowserNavigation,
  )

  isBrowserListenerConfigured = true
}

function removeBrowserListenersWhenUnused(): void {
  if (
    !ensureBrowserIsAvailable() ||
    !isBrowserListenerConfigured ||
    routeListeners.size > 0
  ) {
    return
  }

  window.removeEventListener(
    'popstate',
    handleBrowserNavigation,
  )

  window.removeEventListener(
    'hashchange',
    handleBrowserNavigation,
  )

  isBrowserListenerConfigured = false
}

export function getCurrentAppRoute(): AppRoute {
  if (!ensureBrowserIsAvailable()) {
    return AppRoute.LIBRARY
  }

  const pathname = extractPathFromHash(
    window.location.hash,
  )

  return normalizeAppRoute(pathname)
}

export function navigateToAppRoute(
  route: AppRoute,
  options: NavigateToAppRouteOptions = {},
): void {
  if (!ensureBrowserIsAvailable()) {
    return
  }

  const targetHash = createHashForRoute(route)

  if (window.location.hash === targetHash) {
    scheduleRouteNotification()
    return
  }

  if (options.replace === true) {
    const targetUrl =
      `${window.location.pathname}` +
      `${window.location.search}` +
      targetHash

    window.history.replaceState(
      null,
      '',
      targetUrl,
    )

    scheduleRouteNotification()
    return
  }

  window.location.hash = route
}

export function subscribeToAppRoute(
  listener: AppRouteListener,
): () => void {
  routeListeners.add(listener)
  configureBrowserListeners()

  return () => {
    routeListeners.delete(listener)
    removeBrowserListenersWhenUnused()
  }
}
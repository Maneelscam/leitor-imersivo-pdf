export const AppRoute = {
  LIBRARY: '/',
  READER: '/reader',
  SETTINGS: '/settings',
} as const

export type AppRoute =
  (typeof AppRoute)[keyof typeof AppRoute]

export function isAppRoute(
  value: unknown,
): value is AppRoute {
  return (
    typeof value === 'string' &&
    Object.values(AppRoute).includes(
      value as AppRoute,
    )
  )
}

export function normalizeAppRoute(
  pathname: string,
): AppRoute {
  const normalizedPathname =
    pathname.length > 1
      ? pathname.replace(/\/+$/, '')
      : pathname

  if (isAppRoute(normalizedPathname)) {
    return normalizedPathname
  }

  return AppRoute.LIBRARY
}
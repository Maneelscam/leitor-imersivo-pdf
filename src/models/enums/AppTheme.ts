export const AppTheme = {
  DARK: 'dark',
  OLED: 'oled',
  GRAPHITE: 'graphite',
  LIGHT: 'light',
  SEPIA: 'sepia',
  EMERALD: 'emerald',
  DEEP_NIGHT: 'deep-night',
  COPPER: 'copper',
  SILVER: 'silver',
  IVORY: 'ivory',
} as const

export type AppTheme =
  (typeof AppTheme)[keyof typeof AppTheme]

export function isAppTheme(
  value: unknown,
): value is AppTheme {
  return (
    typeof value === 'string' &&
    Object.values(AppTheme).includes(
      value as AppTheme,
    )
  )
}
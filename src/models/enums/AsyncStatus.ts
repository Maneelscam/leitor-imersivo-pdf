export const AsyncStatus = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const

export type AsyncStatus =
  (typeof AsyncStatus)[keyof typeof AsyncStatus]

export function isAsyncStatus(
  value: unknown,
): value is AsyncStatus {
  return (
    typeof value === 'string' &&
    Object.values(AsyncStatus).includes(
      value as AsyncStatus,
    )
  )
}
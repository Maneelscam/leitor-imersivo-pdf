import type { HTMLAttributes } from 'react'

import '@/styles/components/loading-indicator.css'

export const LoadingIndicatorSize = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
} as const

export type LoadingIndicatorSize =
  (typeof LoadingIndicatorSize)[keyof typeof LoadingIndicatorSize]

export interface LoadingIndicatorProps
  extends HTMLAttributes<HTMLDivElement> {
  readonly label?: string
  readonly size?: LoadingIndicatorSize
  readonly vertical?: boolean
  readonly fullArea?: boolean
}

function createLoadingIndicatorClassName(
  size: LoadingIndicatorSize,
  vertical: boolean,
  fullArea: boolean,
  customClassName: string | undefined,
): string {
  const classNames = ['loading-indicator']

  if (size !== LoadingIndicatorSize.MEDIUM) {
    classNames.push(`loading-indicator--${size}`)
  }

  if (vertical) {
    classNames.push('loading-indicator--vertical')
  }

  if (fullArea) {
    classNames.push('loading-indicator--full-area')
  }

  if (
    customClassName !== undefined &&
    customClassName.trim().length > 0
  ) {
    classNames.push(customClassName)
  }

  return classNames.join(' ')
}

export function LoadingIndicator({
  label = 'Carregando...',
  size = LoadingIndicatorSize.MEDIUM,
  vertical = false,
  fullArea = false,
  className,
  role = 'status',
  ...containerProps
}: LoadingIndicatorProps) {
  const loadingIndicatorClassName =
    createLoadingIndicatorClassName(
      size,
      vertical,
      fullArea,
      className,
    )

  return (
    <div
      {...containerProps}
      role={role}
      className={loadingIndicatorClassName}
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className="loading-indicator__spinner"
        aria-hidden="true"
      />

      {label.length > 0 && (
        <span className="loading-indicator__label">
          {label}
        </span>
      )}
    </div>
  )
}
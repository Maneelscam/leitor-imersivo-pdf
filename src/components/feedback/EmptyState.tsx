import type {
  HTMLAttributes,
  ReactNode,
} from 'react'

import '@/styles/components/empty-state.css'

export interface EmptyStateProps
  extends HTMLAttributes<HTMLDivElement> {
  readonly title: string
  readonly description?: string
  readonly icon?: ReactNode
  readonly actions?: ReactNode
  readonly compact?: boolean
}

function createEmptyStateClassName(
  compact: boolean,
  customClassName: string | undefined,
): string {
  const classNames = ['empty-state']

  if (compact) {
    classNames.push('empty-state--compact')
  }

  if (
    customClassName !== undefined &&
    customClassName.trim().length > 0
  ) {
    classNames.push(customClassName)
  }

  return classNames.join(' ')
}

export function EmptyState({
  title,
  description,
  icon,
  actions,
  compact = false,
  className,
  children,
  ...containerProps
}: EmptyStateProps) {
  const emptyStateClassName =
    createEmptyStateClassName(
      compact,
      className,
    )

  const normalizedTitle = title.trim()

  const hasDescription =
    description !== undefined &&
    description.trim().length > 0

  return (
    <div
      {...containerProps}
      className={emptyStateClassName}
    >
      <div className="empty-state__content">
        {icon !== undefined && (
          <div
            className="empty-state__icon"
            aria-hidden="true"
          >
            {icon}
          </div>
        )}

        <div className="empty-state__text">
          <h2 className="empty-state__title">
            {normalizedTitle}
          </h2>

          {hasDescription && (
            <p className="empty-state__description">
              {description}
            </p>
          )}

          {children}
        </div>

        {actions !== undefined && (
          <div className="empty-state__actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
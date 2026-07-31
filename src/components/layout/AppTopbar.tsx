import type {
  HTMLAttributes,
  ReactNode,
} from 'react'

import '@/styles/components/app-topbar.css'

export interface AppTopbarProps
  extends HTMLAttributes<HTMLDivElement> {
  readonly eyebrow?: string
  readonly title: string
  readonly description?: string

  readonly actions?: ReactNode

  readonly showLocalStatus?: boolean
  readonly localStatusLabel?: string
}

export function AppTopbar({
  eyebrow,
  title,
  description,
  actions,
  showLocalStatus = true,
  localStatusLabel = 'Funcionamento local',
  className,
  ...containerProps
}: AppTopbarProps) {
  const normalizedEyebrow = eyebrow?.trim()
  const normalizedTitle = title.trim()
  const normalizedDescription = description?.trim()
  const normalizedStatusLabel =
    localStatusLabel.trim()

  const hasEyebrow =
    normalizedEyebrow !== undefined &&
    normalizedEyebrow.length > 0

  const hasDescription =
    normalizedDescription !== undefined &&
    normalizedDescription.length > 0

  const hasLocalStatus =
    showLocalStatus &&
    normalizedStatusLabel.length > 0

  const classNames = ['app-topbar']

  if (
    className !== undefined &&
    className.trim().length > 0
  ) {
    classNames.push(className)
  }

  return (
    <div
      {...containerProps}
      className={classNames.join(' ')}
    >
      <div className="app-topbar__heading">
        {hasEyebrow && (
          <span className="app-topbar__eyebrow">
            {normalizedEyebrow}
          </span>
        )}

        <h1 className="app-topbar__title">
          {normalizedTitle}
        </h1>

        {hasDescription && (
          <p className="app-topbar__description">
            {normalizedDescription}
          </p>
        )}
      </div>

      {(hasLocalStatus || actions !== undefined) && (
        <div className="app-topbar__actions">
          {hasLocalStatus && (
            <div
              className="app-topbar__status"
              role="status"
              aria-label={normalizedStatusLabel}
            >
              <span
                className="app-topbar__status-indicator"
                aria-hidden="true"
              />

              <span className="app-topbar__status-label">
                {normalizedStatusLabel}
              </span>
            </div>
          )}

          {actions}
        </div>
      )}
    </div>
  )
}
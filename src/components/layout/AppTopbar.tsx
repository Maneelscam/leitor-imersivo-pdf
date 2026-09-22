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

}

export function AppTopbar({
  eyebrow,
  title,
  description,
  actions,
  className,
  ...containerProps
}: AppTopbarProps) {
  const normalizedEyebrow = eyebrow?.trim()
  const normalizedTitle = title.trim()
  const normalizedDescription = description?.trim()
const hasEyebrow =
    normalizedEyebrow !== undefined &&
    normalizedEyebrow.length > 0

  const hasDescription =
    normalizedDescription !== undefined &&
    normalizedDescription.length > 0
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

      {actions !== undefined && (
        <div className="app-topbar__actions">

          {actions}
        </div>
      )}
    </div>
  )
}
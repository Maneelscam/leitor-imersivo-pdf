import type {
  HTMLAttributes,
  ReactNode,
} from 'react'

import '@/styles/components/feedback-message.css'

export const FeedbackMessageVariant = {
  INFORMATION: 'information',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const

export type FeedbackMessageVariant =
  (typeof FeedbackMessageVariant)[keyof typeof FeedbackMessageVariant]

export interface FeedbackMessageProps
  extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: FeedbackMessageVariant
  readonly title?: string
  readonly description?: string
  readonly icon?: ReactNode
  readonly action?: ReactNode
  readonly compact?: boolean
}

function createFeedbackMessageClassName(
  variant: FeedbackMessageVariant,
  compact: boolean,
  customClassName: string | undefined,
): string {
  const classNames = [
    'feedback-message',
    `feedback-message--${variant}`,
  ]

  if (compact) {
    classNames.push('feedback-message--compact')
  }

  if (
    customClassName !== undefined &&
    customClassName.trim().length > 0
  ) {
    classNames.push(customClassName)
  }

  return classNames.join(' ')
}

function resolveDefaultRole(
  variant: FeedbackMessageVariant,
): 'alert' | 'status' {
  if (
    variant === FeedbackMessageVariant.ERROR ||
    variant === FeedbackMessageVariant.WARNING
  ) {
    return 'alert'
  }

  return 'status'
}

export function FeedbackMessage({
  variant = FeedbackMessageVariant.INFORMATION,
  title,
  description,
  icon,
  action,
  compact = false,
  className,
  role,
  children,
  ...containerProps
}: FeedbackMessageProps) {
  const feedbackMessageClassName =
    createFeedbackMessageClassName(
      variant,
      compact,
      className,
    )

  const resolvedRole =
    role ?? resolveDefaultRole(variant)

  const hasTitle =
    title !== undefined &&
    title.trim().length > 0

  const hasDescription =
    description !== undefined &&
    description.trim().length > 0

  const hasContent =
    hasTitle ||
    hasDescription ||
    children !== undefined

  return (
    <div
      {...containerProps}
      role={resolvedRole}
      className={feedbackMessageClassName}
      aria-live={
        resolvedRole === 'alert'
          ? 'assertive'
          : 'polite'
      }
    >
      {icon !== undefined && (
        <span
          className="feedback-message__icon"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}

      {hasContent && (
        <div className="feedback-message__content">
          {hasTitle && (
            <div className="feedback-message__title">
              {title}
            </div>
          )}

          {hasDescription && (
            <div className="feedback-message__description">
              {description}
            </div>
          )}

          {children}
        </div>
      )}

      {action !== undefined && (
        <div className="feedback-message__action">
          {action}
        </div>
      )}
    </div>
  )
}
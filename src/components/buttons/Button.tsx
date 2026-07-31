import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'

import '@/styles/components/button.css'

export const ButtonVariant = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  GHOST: 'ghost',
  DANGER: 'danger',
} as const

export type ButtonVariant =
  (typeof ButtonVariant)[keyof typeof ButtonVariant]

export const ButtonSize = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
} as const

export type ButtonSize =
  (typeof ButtonSize)[keyof typeof ButtonSize]

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize

  readonly leadingIcon?: ReactNode
  readonly trailingIcon?: ReactNode

  readonly iconOnly?: boolean
  readonly fullWidth?: boolean
}

function createButtonClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  iconOnly: boolean,
  fullWidth: boolean,
  customClassName: string | undefined,
): string {
  const classNames = [
    'button',
    `button--${variant}`,
  ]

  if (size !== ButtonSize.MEDIUM) {
    classNames.push(`button--${size}`)
  }

  if (iconOnly) {
    classNames.push('button--icon-only')
  }

  if (fullWidth) {
    classNames.push('button--full-width')
  }

  if (
    customClassName !== undefined &&
    customClassName.trim().length > 0
  ) {
    classNames.push(customClassName)
  }

  return classNames.join(' ')
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonProps
>(function Button(
  {
    variant = ButtonVariant.SECONDARY,
    size = ButtonSize.MEDIUM,
    leadingIcon,
    trailingIcon,
    iconOnly = false,
    fullWidth = false,
    className,
    children,
    type = 'button',
    ...buttonProps
  },
  ref,
) {
  const buttonClassName = createButtonClassName(
    variant,
    size,
    iconOnly,
    fullWidth,
    className,
  )

  return (
    <button
      {...buttonProps}
      ref={ref}
      type={type}
      className={buttonClassName}
    >
      {leadingIcon !== undefined && (
        <span
          className="button__icon"
          aria-hidden="true"
        >
          {leadingIcon}
        </span>
      )}

      {!iconOnly && children !== undefined && (
        <span className="button__label">
          {children}
        </span>
      )}

      {iconOnly && children}

      {trailingIcon !== undefined && (
        <span
          className="button__icon"
          aria-hidden="true"
        >
          {trailingIcon}
        </span>
      )}
    </button>
  )
})
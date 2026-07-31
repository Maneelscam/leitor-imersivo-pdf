import {
  useEffect,
  useId,
  useRef,
  type DialogHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react'

import {
  Button,
  ButtonVariant,
} from '@/components/buttons/Button'

import '@/styles/components/confirm-dialog.css'

export interface ConfirmDialogProps
  extends Omit<
    DialogHTMLAttributes<HTMLDialogElement>,
    'open' | 'onCancel'
  > {
  readonly open: boolean
  readonly title: string
  readonly description?: string

  readonly confirmLabel?: string
  readonly cancelLabel?: string

  readonly destructive?: boolean
  readonly isConfirming?: boolean

  readonly icon?: ReactNode
  readonly children?: ReactNode

  readonly onConfirm: () => void | Promise<void>
  readonly onCancel: () => void
}

function WarningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.3 3.8 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

function createDialogClassName(
  customClassName: string | undefined,
): string {
  const classNames = ['confirm-dialog']

  if (
    customClassName !== undefined &&
    customClassName.trim().length > 0
  ) {
    classNames.push(customClassName)
  }

  return classNames.join(' ')
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = true,
  isConfirming = false,
  icon,
  children,
  onConfirm,
  onCancel,
  className,
  ...dialogProps
}: ConfirmDialogProps) {
  const dialogRef =
    useRef<HTMLDialogElement>(null)

  const titleId = useId()
  const descriptionId = useId()

  const normalizedTitle = title.trim()
  const normalizedDescription = description?.trim()

  const hasDescription =
    normalizedDescription !== undefined &&
    normalizedDescription.length > 0

  useEffect(() => {
    const dialog = dialogRef.current

    if (dialog === null) {
      return
    }

    if (open && !dialog.open) {
      dialog.showModal()
      return
    }

    if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const handleNativeCancel = (
    event: SyntheticEvent<HTMLDialogElement>,
  ) => {
    event.preventDefault()

    if (!isConfirming) {
      onCancel()
    }
  }

  const handleBackdropClick = (
    event: MouseEvent<HTMLDialogElement>,
  ) => {
    if (
      event.target === event.currentTarget &&
      !isConfirming
    ) {
      onCancel()
    }
  }

  const handleConfirm = () => {
    if (isConfirming) {
      return
    }

    void onConfirm()
  }

  const descriptionAccessibilityProps =
    hasDescription
      ? {
          'aria-describedby': descriptionId,
        }
      : {}

  return (
    <dialog
      {...dialogProps}
      {...descriptionAccessibilityProps}
      ref={dialogRef}
      className={createDialogClassName(className)}
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={handleNativeCancel}
      onClick={handleBackdropClick}
    >
      <div className="confirm-dialog__content">
        <div className="confirm-dialog__header">
          <div
            className="confirm-dialog__icon"
            aria-hidden="true"
          >
            {icon ?? <WarningIcon />}
          </div>

          <div className="confirm-dialog__heading">
            <h2
              id={titleId}
              className="confirm-dialog__title"
            >
              {normalizedTitle}
            </h2>

            {hasDescription && (
              <p
                id={descriptionId}
                className="confirm-dialog__description"
              >
                {normalizedDescription}
              </p>
            )}
          </div>
        </div>

        {children !== undefined && (
          <div className="confirm-dialog__body">
            {children}
          </div>
        )}

        <div className="confirm-dialog__actions">
          <Button
            variant={ButtonVariant.SECONDARY}
            disabled={isConfirming}
            autoFocus
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>

          <Button
            variant={
              destructive
                ? ButtonVariant.DANGER
                : ButtonVariant.PRIMARY
            }
            disabled={isConfirming}
            aria-busy={isConfirming}
            onClick={handleConfirm}
          >
            {isConfirming
              ? 'Processando...'
              : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
import type {
  HTMLAttributes,
} from 'react'

import '@/styles/components/reader-rotation-controls.css'

export interface ReaderRotationControlsProps
  extends HTMLAttributes<HTMLDivElement> {
  readonly rotation: number
  readonly disabled?: boolean

  readonly onRotationChange: (
    rotation: number,
  ) => void
}

function RotateLeftIcon() {
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
      <path d="M4 7v5h5" />
      <path d="M5.8 16.5A7 7 0 1 0 5 9" />
    </svg>
  )
}

function RotateRightIcon() {
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
      <path d="M20 7v5h-5" />
      <path d="M18.2 16.5A7 7 0 1 1 19 9" />
    </svg>
  )
}

function createControlsClassName(
  customClassName: string | undefined,
): string {
  const classNames = [
    'reader-rotation-controls',
  ]

  if (
    customClassName !== undefined &&
    customClassName.trim().length > 0
  ) {
    classNames.push(customClassName)
  }

  return classNames.join(' ')
}

function normalizeRotation(
  rotation: number,
): number {
  if (!Number.isFinite(rotation)) {
    return 0
  }

  const snappedRotation =
    Math.round(rotation / 90) * 90

  const normalizedRotation =
    snappedRotation % 360

  return normalizedRotation < 0
    ? normalizedRotation + 360
    : normalizedRotation
}

export function ReaderRotationControls({
  rotation,
  disabled = false,
  onRotationChange,
  className,
  ...containerProps
}: ReaderRotationControlsProps) {
  const normalizedRotation =
    normalizeRotation(rotation)

  const handleRotateLeft = () => {
    if (disabled) {
      return
    }

    onRotationChange(
      normalizeRotation(
        normalizedRotation - 90,
      ),
    )
  }

  const handleRotateRight = () => {
    if (disabled) {
      return
    }

    onRotationChange(
      normalizeRotation(
        normalizedRotation + 90,
      ),
    )
  }

  return (
    <div
      {...containerProps}
      className={createControlsClassName(
        className,
      )}
      aria-label="Controles de rotação"
    >
      <button
        type="button"
        className="reader-rotation-controls__button"
        disabled={disabled}
        aria-label="Girar página para a esquerda"
        title="Girar para a esquerda"
        onClick={handleRotateLeft}
      >
        <RotateLeftIcon />
      </button>

      <output
        className="reader-rotation-controls__value"
        aria-live="polite"
        aria-label={
          `Rotação atual: ${normalizedRotation} graus`
        }
      >
        {normalizedRotation}°
      </output>

      <button
        type="button"
        className="reader-rotation-controls__button"
        disabled={disabled}
        aria-label="Girar página para a direita"
        title="Girar para a direita"
        onClick={handleRotateRight}
      >
        <RotateRightIcon />
      </button>
    </div>
  )
}
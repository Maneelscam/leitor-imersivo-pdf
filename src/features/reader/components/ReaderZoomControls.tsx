import type {
  HTMLAttributes,
} from 'react'

import '@/styles/components/reader-zoom-controls.css'

export interface ReaderZoomControlsProps
  extends HTMLAttributes<HTMLDivElement> {
  readonly scale: number

  readonly minimumScale?: number
  readonly maximumScale?: number
  readonly scaleStep?: number

  readonly disabled?: boolean

  readonly onScaleChange: (
    scale: number,
  ) => void

  readonly onFitWidth: () => void
}

function ZoomOutIcon() {
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
      <circle
        cx="10.5"
        cy="10.5"
        r="6.5"
      />

      <path d="M15.5 15.5 21 21" />
      <path d="M7.5 10.5h6" />
    </svg>
  )
}

function ZoomInIcon() {
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
      <circle
        cx="10.5"
        cy="10.5"
        r="6.5"
      />

      <path d="M15.5 15.5 21 21" />
      <path d="M7.5 10.5h6" />
      <path d="M10.5 7.5v6" />
    </svg>
  )
}

function createControlsClassName(
  customClassName: string | undefined,
): string {
  const classNames = [
    'reader-zoom-controls',
  ]

  if (
    customClassName !== undefined &&
    customClassName.trim().length > 0
  ) {
    classNames.push(customClassName)
  }

  return classNames.join(' ')
}

function normalizePositiveValue(
  value: number,
  fallback: number,
): number {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return fallback
  }

  return value
}

function clampScale(
  scale: number,
  minimumScale: number,
  maximumScale: number,
): number {
  if (!Number.isFinite(scale)) {
    return minimumScale
  }

  return Math.min(
    Math.max(
      scale,
      minimumScale,
    ),
    maximumScale,
  )
}

function roundScale(
  scale: number,
): number {
  return Math.round(
    scale * 100,
  ) / 100
}

export function ReaderZoomControls({
  scale,
  minimumScale = 0.5,
  maximumScale = 3,
  scaleStep = 0.1,
  disabled = false,
  onScaleChange,
  onFitWidth,
  className,
  ...containerProps
}: ReaderZoomControlsProps) {
  const normalizedMinimumScale =
    normalizePositiveValue(
      minimumScale,
      0.5,
    )

  const normalizedMaximumScale =
    Math.max(
      normalizedMinimumScale,
      normalizePositiveValue(
        maximumScale,
        3,
      ),
    )

  const normalizedScaleStep =
    normalizePositiveValue(
      scaleStep,
      0.1,
    )

  const normalizedScale =
    clampScale(
      scale,
      normalizedMinimumScale,
      normalizedMaximumScale,
    )

  const zoomPercentage = Math.round(
    normalizedScale * 100,
  )

  const zoomOutDisabled =
    disabled ||
    normalizedScale <=
      normalizedMinimumScale

  const zoomInDisabled =
    disabled ||
    normalizedScale >=
      normalizedMaximumScale

  const handleZoomOut = () => {
    if (zoomOutDisabled) {
      return
    }

    const nextScale = clampScale(
      roundScale(
        normalizedScale -
          normalizedScaleStep,
      ),
      normalizedMinimumScale,
      normalizedMaximumScale,
    )

    onScaleChange(nextScale)
  }

  const handleZoomIn = () => {
    if (zoomInDisabled) {
      return
    }

    const nextScale = clampScale(
      roundScale(
        normalizedScale +
          normalizedScaleStep,
      ),
      normalizedMinimumScale,
      normalizedMaximumScale,
    )

    onScaleChange(nextScale)
  }

  const handleFitWidth = () => {
    if (disabled) {
      return
    }

    onFitWidth()
  }

  return (
    <div
      {...containerProps}
      className={createControlsClassName(
        className,
      )}
      aria-label="Controles de zoom"
    >
      <button
        type="button"
        className="reader-zoom-controls__button"
        disabled={zoomOutDisabled}
        aria-label="Diminuir zoom"
        title="Diminuir zoom"
        onClick={handleZoomOut}
      >
        <ZoomOutIcon />
      </button>

      <output
        className="reader-zoom-controls__value"
        aria-live="polite"
        aria-label={`Zoom atual: ${zoomPercentage}%`}
      >
        {zoomPercentage}%
      </output>

      <button
        type="button"
        className="reader-zoom-controls__button"
        disabled={zoomInDisabled}
        aria-label="Aumentar zoom"
        title="Aumentar zoom"
        onClick={handleZoomIn}
      >
        <ZoomInIcon />
      </button>

      <button
        type="button"
        className="reader-zoom-controls__fit-button"
        disabled={disabled}
        aria-label="Ajustar página à largura disponível"
        title="Ajustar à largura"
        onClick={handleFitWidth}
      >
        Ajustar à largura
      </button>
    </div>
  )
}
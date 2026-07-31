import {
  useEffect,
  useRef,
  type CanvasHTMLAttributes,
} from 'react'

import type {
  PDFPageProxy,
  RenderTask,
} from 'pdfjs-dist'

export interface PdfPageCanvasProps
  extends Omit<
    CanvasHTMLAttributes<HTMLCanvasElement>,
    'width' | 'height'
  > {
  readonly page: PDFPageProxy | null
  readonly scale: number
  readonly rotation?: number

  readonly onRenderStart?: () => void
  readonly onRenderSuccess?: () => void
  readonly onRenderError?: (
    error: unknown,
  ) => void
}

function createCanvasClassName(
  customClassName: string | undefined,
): string {
  const classNames = ['reader-page__canvas']

  if (
    customClassName !== undefined &&
    customClassName.trim().length > 0
  ) {
    classNames.push(customClassName)
  }

  return classNames.join(' ')
}

function normalizeScale(scale: number): number {
  if (!Number.isFinite(scale) || scale <= 0) {
    return 1
  }

  return Math.min(
    Math.max(scale, 0.25),
    5,
  )
}

function normalizeRotation(
  rotation: number,
): number {
  if (!Number.isFinite(rotation)) {
    return 0
  }

  const normalizedRotation =
    Math.trunc(rotation) % 360

  return normalizedRotation < 0
    ? normalizedRotation + 360
    : normalizedRotation
}

function getOutputScale(): number {
  const devicePixelRatio =
    window.devicePixelRatio

  if (
    !Number.isFinite(devicePixelRatio) ||
    devicePixelRatio <= 1
  ) {
    return 1
  }

  return Math.min(devicePixelRatio, 2.5)
}

export function PdfPageCanvas({
  page,
  scale,
  rotation = 0,
  onRenderStart,
  onRenderSuccess,
  onRenderError,
  className,
  ...canvasProps
}: PdfPageCanvasProps) {
  const canvasRef =
    useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (canvas === null) {
      return
    }

    if (page === null) {
      canvas.width = 0
      canvas.height = 0
      canvas.style.width = '0px'
      canvas.style.height = '0px'

      return
    }

    const normalizedScale =
      normalizeScale(scale)

    const normalizedRotation =
      normalizeRotation(rotation)

    const viewport = page.getViewport({
      scale: normalizedScale,
      rotation: normalizedRotation,
    })

    const outputScale = getOutputScale()

    canvas.width = Math.max(
      1,
      Math.floor(
        viewport.width * outputScale,
      ),
    )

    canvas.height = Math.max(
      1,
      Math.floor(
        viewport.height * outputScale,
      ),
    )

    canvas.style.width =
      `${Math.floor(viewport.width)}px`

    canvas.style.height =
      `${Math.floor(viewport.height)}px`

    const renderTask: RenderTask =
      outputScale === 1
        ? page.render({
            canvas,
            viewport,
          })
        : page.render({
            canvas,
            viewport,
            transform: [
              outputScale,
              0,
              0,
              outputScale,
              0,
              0,
            ],
          })

    let renderWasCancelled = false

    onRenderStart?.()

    void renderTask.promise
      .then(() => {
        if (!renderWasCancelled) {
          onRenderSuccess?.()
        }
      })
      .catch((error: unknown) => {
        if (!renderWasCancelled) {
          onRenderError?.(error)
        }
      })

    return () => {
      renderWasCancelled = true
      renderTask.cancel()
    }
  }, [
    page,
    scale,
    rotation,
    onRenderStart,
    onRenderSuccess,
    onRenderError,
  ])

  return (
    <canvas
      {...canvasProps}
      ref={canvasRef}
      className={createCanvasClassName(
        className,
      )}
      aria-label={
        canvasProps['aria-label'] ??
        'Página renderizada do documento PDF'
      }
    />
  )
}
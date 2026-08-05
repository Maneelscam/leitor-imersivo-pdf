import type {
  CSSProperties,
  HTMLAttributes,
} from 'react'

import type {
  PDFPageProxy,
} from 'pdfjs-dist'

import type {
  HighlightAnnotation,
} from '@/models/entities/Annotation'
import type {
  AnnotationArea,
} from '@/models/value-objects/AnnotationArea'

import '@/styles/components/pdf-annotation-highlight-layer.css'

export interface PdfAnnotationHighlightLayerProps
  extends HTMLAttributes<HTMLDivElement> {
  readonly page: PDFPageProxy
  readonly scale: number
  readonly rotation?: number

  readonly annotations:
    readonly HighlightAnnotation[]
}

interface AnnotationRectangle {
  readonly annotationId: string
  readonly areaIndex: number

  readonly color:
    HighlightAnnotation['color']

  readonly left: number
  readonly top: number

  readonly width: number
  readonly height: number
}

function normalizeScale(
  scale: number,
): number {
  if (
    !Number.isFinite(scale) ||
    scale <= 0
  ) {
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

function normalizeCoordinate(
  coordinate: number,
): number {
  if (!Number.isFinite(coordinate)) {
    return 0
  }

  return coordinate
}

function createAnnotationRectangle(
  page: PDFPageProxy,
  scale: number,
  rotation: number,
  annotation: HighlightAnnotation,
  area: AnnotationArea,
  areaIndex: number,
): AnnotationRectangle {
  const viewport =
    page.getViewport({
      scale,
      rotation,
    })

  const viewportRectangle =
    viewport.convertToViewportRectangle([
      normalizeCoordinate(area.left),
      normalizeCoordinate(area.bottom),
      normalizeCoordinate(area.right),
      normalizeCoordinate(area.top),
    ])

  const firstX =
    viewportRectangle[0]

  const firstY =
    viewportRectangle[1]

  const secondX =
    viewportRectangle[2]

  const secondY =
    viewportRectangle[3]

  const left =
    Math.min(
      firstX,
      secondX,
    )

  const top =
    Math.min(
      firstY,
      secondY,
    )

  return {
    annotationId:
      annotation.id,

    areaIndex,

    color:
      annotation.color,

    left,
    top,

    width:
      Math.max(
        1,
        Math.abs(
          secondX -
          firstX,
        ),
      ),

    height:
      Math.max(
        1,
        Math.abs(
          secondY -
          firstY,
        ),
      ),
  }
}

function createAnnotationRectangles(
  page: PDFPageProxy,
  scale: number,
  rotation: number,
  annotations:
    readonly HighlightAnnotation[],
): readonly AnnotationRectangle[] {
  return annotations.flatMap(
    (annotation) =>
      annotation.areas.map(
        (
          area,
          areaIndex,
        ) =>
          createAnnotationRectangle(
            page,
            scale,
            rotation,
            annotation,
            area,
            areaIndex,
          ),
      ),
  )
}

function createHighlightClassName(
  color:
    HighlightAnnotation['color'],
): string {
  return [
    'pdf-annotation-highlight-layer__highlight',
    `pdf-annotation-highlight-layer__highlight--${color}`,
  ].join(' ')
}

export function PdfAnnotationHighlightLayer({
  page,
  scale,
  rotation = 0,
  annotations,
  className,
  ...layerProps
}: PdfAnnotationHighlightLayerProps) {
  const normalizedScale =
    normalizeScale(scale)

  const normalizedRotation =
    normalizeRotation(rotation)

  const viewport =
    page.getViewport({
      scale: normalizedScale,
      rotation: normalizedRotation,
    })

  const annotationRectangles =
    createAnnotationRectangles(
      page,
      normalizedScale,
      normalizedRotation,
      annotations,
    )

  const layerStyle: CSSProperties = {
    width:
      `${Math.floor(viewport.width)}px`,

    height:
      `${Math.floor(viewport.height)}px`,
  }

  const layerClassName = [
    'pdf-annotation-highlight-layer',
    className,
  ]
    .filter(
      (
        classNameValue,
      ): classNameValue is string =>
        classNameValue !== undefined &&
        classNameValue.trim().length > 0,
    )
    .join(' ')

  return (
    <div
      {...layerProps}
      className={layerClassName}
      style={layerStyle}
      aria-hidden="true"
    >
      {annotationRectangles.map(
        (rectangle) => {
          const highlightStyle:
            CSSProperties = {
              left:
                `${rectangle.left}px`,

              top:
                `${rectangle.top}px`,

              width:
                `${rectangle.width}px`,

              height:
                `${rectangle.height}px`,
            }

          return (
            <span
              key={[
                rectangle.annotationId,
                rectangle.areaIndex,
              ].join(':')}
              className={
                createHighlightClassName(
                  rectangle.color,
                )
              }
              style={highlightStyle}
            />
          )
        },
      )}
    </div>
  )
}

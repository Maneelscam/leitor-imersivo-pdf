import type {
  CSSProperties,
  HTMLAttributes,
} from 'react'

import type {
  PDFPageProxy,
} from 'pdfjs-dist'

import type {
  PdfTextSearchHighlightArea,
  PdfTextSearchOccurrence,
} from '@/models/dtos/PdfTextSearchResult'

import '@/styles/components/pdf-text-search-highlight-layer.css'

export interface PdfTextSearchHighlightLayerProps
  extends HTMLAttributes<HTMLDivElement> {
  readonly page: PDFPageProxy
  readonly scale: number
  readonly rotation?: number

  readonly occurrences:
    readonly PdfTextSearchOccurrence[]

  readonly activeOccurrenceIndex?:
    number | null
}

interface HighlightRectangle {
  readonly occurrenceIndexOnPage:
    number

  readonly areaIndex: number

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
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return value
}

function createHighlightRectangle(
  page: PDFPageProxy,
  scale: number,
  rotation: number,
  occurrenceIndexOnPage: number,
  areaIndex: number,
  area: PdfTextSearchHighlightArea,
): HighlightRectangle {
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
    occurrenceIndexOnPage,
    areaIndex,

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

function createHighlightRectangles(
  page: PDFPageProxy,
  scale: number,
  rotation: number,
  occurrences:
    readonly PdfTextSearchOccurrence[],
): readonly HighlightRectangle[] {
  return occurrences.flatMap(
    (occurrence) =>
      occurrence.highlightAreas.map(
        (
          area,
          areaIndex,
        ) =>
          createHighlightRectangle(
            page,
            scale,
            rotation,
            occurrence
              .occurrenceIndexOnPage,
            areaIndex,
            area,
          ),
      ),
  )
}

function createHighlightClassName(
  isActive: boolean,
): string {
  const classNames = [
    'pdf-text-search-highlight-layer__highlight',
  ]

  if (isActive) {
    classNames.push(
      'pdf-text-search-highlight-layer__highlight--active',
    )
  }

  return classNames.join(' ')
}

export function PdfTextSearchHighlightLayer({
  page,
  scale,
  rotation = 0,
  occurrences,
  activeOccurrenceIndex = null,
  className,
  ...layerProps
}: PdfTextSearchHighlightLayerProps) {
  const normalizedScale =
    normalizeScale(scale)

  const normalizedRotation =
    normalizeRotation(rotation)

  const viewport =
    page.getViewport({
      scale: normalizedScale,
      rotation: normalizedRotation,
    })

  const highlightRectangles =
    createHighlightRectangles(
      page,
      normalizedScale,
      normalizedRotation,
      occurrences,
    )

  const layerStyle: CSSProperties = {
    width:
      `${Math.floor(viewport.width)}px`,

    height:
      `${Math.floor(viewport.height)}px`,
  }

  const layerClassName = [
    'pdf-text-search-highlight-layer',
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
      {highlightRectangles.map(
        (rectangle) => {
          const isActive =
            rectangle
              .occurrenceIndexOnPage ===
            activeOccurrenceIndex

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
                rectangle
                  .occurrenceIndexOnPage,
                rectangle.areaIndex,
              ].join(':')}
              className={
                createHighlightClassName(
                  isActive,
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
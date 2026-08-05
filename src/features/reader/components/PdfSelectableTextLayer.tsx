import {
  useCallback,
  useEffect,
  useRef,
  type HTMLAttributes,
} from 'react'

import {
  TextLayer,
  type PDFPageProxy,
} from 'pdfjs-dist'

import type {
  PdfTextSelection,
} from '@/models/dtos/PdfTextSelection'
import type {
  AnnotationArea,
} from '@/models/value-objects/AnnotationArea'

import '@/styles/components/pdf-selectable-text-layer.css'

const MINIMUM_RECTANGLE_SIZE = 0.5
const AREA_PRECISION = 1000

export interface PdfSelectableTextLayerProps
  extends HTMLAttributes<HTMLDivElement> {
  readonly page: PDFPageProxy
  readonly scale: number
  readonly rotation?: number

  readonly onTextSelection: (
    selection: PdfTextSelection | null,
  ) => void
}

interface ViewportRectangle {
  readonly left: number
  readonly top: number
  readonly right: number
  readonly bottom: number
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

function normalizePageOffsetRatio(
  pageOffsetRatio: number,
): number {
  if (!Number.isFinite(pageOffsetRatio)) {
    return 0
  }

  return Math.min(
    Math.max(pageOffsetRatio, 0),
    1,
  )
}

function normalizeSelectedText(
  selectedText: string,
): string {
  return selectedText
    .replace(/\s+/g, ' ')
    .trim()
}

function roundCoordinate(
  coordinate: number,
): number {
  return (
    Math.round(
      coordinate * AREA_PRECISION,
    ) / AREA_PRECISION
  )
}

function isSelectionNodeInsideLayer(
  layerElement: HTMLDivElement,
  node: Node | null,
): boolean {
  if (node === null) {
    return false
  }

  if (node === layerElement) {
    return true
  }

  return layerElement.contains(node)
}

function clipClientRectangleToLayer(
  rectangle: DOMRect,
  layerRectangle: DOMRect,
): ViewportRectangle | null {
  const left =
    Math.max(
      rectangle.left,
      layerRectangle.left,
    ) - layerRectangle.left

  const top =
    Math.max(
      rectangle.top,
      layerRectangle.top,
    ) - layerRectangle.top

  const right =
    Math.min(
      rectangle.right,
      layerRectangle.right,
    ) - layerRectangle.left

  const bottom =
    Math.min(
      rectangle.bottom,
      layerRectangle.bottom,
    ) - layerRectangle.top

  if (
    right - left <
      MINIMUM_RECTANGLE_SIZE ||
    bottom - top <
      MINIMUM_RECTANGLE_SIZE
  ) {
    return null
  }

  return {
    left,
    top,
    right,
    bottom,
  }
}

function convertViewportRectangleToArea(
  rectangle: ViewportRectangle,
  viewport: ReturnType<
    PDFPageProxy['getViewport']
  >,
): AnnotationArea | null {
  const viewportPoints = [
    [rectangle.left, rectangle.top],
    [rectangle.right, rectangle.top],
    [rectangle.left, rectangle.bottom],
    [rectangle.right, rectangle.bottom],
  ] as const

  const pdfPoints =
    viewportPoints.map(
      ([x, y]) =>
        viewport.convertToPdfPoint(
          x,
          y,
        ),
    )

  const horizontalCoordinates =
    pdfPoints.map(
      ([x]) => x,
    )

  const verticalCoordinates =
    pdfPoints.map(
      ([, y]) => y,
    )

  const left = roundCoordinate(
    Math.min(
      ...horizontalCoordinates,
    ),
  )

  const right = roundCoordinate(
    Math.max(
      ...horizontalCoordinates,
    ),
  )

  const bottom = roundCoordinate(
    Math.min(
      ...verticalCoordinates,
    ),
  )

  const top = roundCoordinate(
    Math.max(
      ...verticalCoordinates,
    ),
  )

  if (
    right - left <= 0 ||
    top - bottom <= 0
  ) {
    return null
  }

  return {
    left,
    bottom,
    right,
    top,
  }
}

function createAreaKey(
  area: AnnotationArea,
): string {
  return [
    area.left,
    area.bottom,
    area.right,
    area.top,
  ].join(':')
}

function createSelectionAreas(
  range: Range,
  layerRectangle: DOMRect,
  viewport: ReturnType<
    PDFPageProxy['getViewport']
  >,
): readonly AnnotationArea[] {
  const uniqueAreas =
    new Map<
      string,
      AnnotationArea
    >()

  for (
    const clientRectangle of
      range.getClientRects()
  ) {
    const viewportRectangle =
      clipClientRectangleToLayer(
        clientRectangle,
        layerRectangle,
      )

    if (viewportRectangle === null) {
      continue
    }

    const area =
      convertViewportRectangleToArea(
        viewportRectangle,
        viewport,
      )

    if (area === null) {
      continue
    }

    uniqueAreas.set(
      createAreaKey(area),
      area,
    )
  }

  return Array.from(
    uniqueAreas.values(),
  )
}

function createLayerClassName(
  customClassName: string | undefined,
): string {
  const classNames = [
    'pdf-selectable-text-layer',
    'textLayer',
  ]

  if (
    customClassName !== undefined &&
    customClassName.trim().length > 0
  ) {
    classNames.push(
      customClassName,
    )
  }

  return classNames.join(' ')
}

export function PdfSelectableTextLayer({
  page,
  scale,
  rotation = 0,
  onTextSelection,
  className,
  ...layerProps
}: PdfSelectableTextLayerProps) {
  const layerRef =
    useRef<HTMLDivElement>(null)

  const normalizedScale =
    normalizeScale(scale)

  const normalizedRotation =
    normalizeRotation(rotation)

  useEffect(() => {
    const layerElement =
      layerRef.current

    if (layerElement === null) {
      return
    }

    layerElement.replaceChildren()

    const viewport =
      page.getViewport({
        scale: normalizedScale,
        rotation: normalizedRotation,
      })

    layerElement.style.setProperty(
      '--total-scale-factor',
      String(
        viewport.scale *
          viewport.userUnit,
      ),
    )

    const textLayer =
      new TextLayer({
        textContentSource:
          page.streamTextContent({
            includeMarkedContent: true,
          }),

        container: layerElement,
        viewport,
      })

    let renderCompleted = false

    void textLayer
      .render()
      .then(() => {
        renderCompleted = true
      })
      .catch(() => {
        if (!renderCompleted) {
          layerElement.replaceChildren()
        }
      })

    return () => {
      if (!renderCompleted) {
        textLayer.cancel()
      }

      layerElement.replaceChildren()
    }
  }, [
    page,
    normalizedScale,
    normalizedRotation,
  ])

  const handleTextSelection =
    useCallback(() => {
      const layerElement =
        layerRef.current

      const browserSelection =
        window.getSelection()

      if (
        layerElement === null ||
        browserSelection === null ||
        browserSelection.isCollapsed ||
        browserSelection.rangeCount === 0 ||
        !isSelectionNodeInsideLayer(
          layerElement,
          browserSelection.anchorNode,
        ) ||
        !isSelectionNodeInsideLayer(
          layerElement,
          browserSelection.focusNode,
        )
      ) {
        onTextSelection(null)
        return
      }

      const selectedText =
        normalizeSelectedText(
          browserSelection.toString(),
        )

      if (selectedText.length === 0) {
        onTextSelection(null)
        return
      }

      const range =
        browserSelection.getRangeAt(0)

      const layerRectangle =
        layerElement
          .getBoundingClientRect()

      if (
        layerRectangle.width <= 0 ||
        layerRectangle.height <= 0
      ) {
        onTextSelection(null)
        return
      }

      const viewport =
        page.getViewport({
          scale: normalizedScale,
          rotation: normalizedRotation,
        })

      const areas =
        createSelectionAreas(
          range,
          layerRectangle,
          viewport,
        )

      if (areas.length === 0) {
        onTextSelection(null)
        return
      }

      const selectionTop =
        Math.min(
          ...Array.from(
            range.getClientRects(),
            (rectangle) =>
              rectangle.top,
          ),
        )

      const pageOffsetRatio =
        normalizePageOffsetRatio(
          (
            selectionTop -
            layerRectangle.top
          ) /
          layerRectangle.height,
        )

      onTextSelection({
        pageNumber:
          page.pageNumber,

        pageOffsetRatio,
        selectedText,
        areas,
      })
    }, [
      page,
      normalizedScale,
      normalizedRotation,
      onTextSelection,
    ])

  const requestTextSelection =
    useCallback(() => {
      window.requestAnimationFrame(
        handleTextSelection,
      )
    }, [
      handleTextSelection,
    ])

  return (
    <div
      {...layerProps}
      ref={layerRef}
      className={
        createLayerClassName(
          className,
        )
      }
      aria-hidden="true"
      onPointerUp={
        requestTextSelection
      }
      onKeyUp={
        requestTextSelection
      }
    />
  )
}

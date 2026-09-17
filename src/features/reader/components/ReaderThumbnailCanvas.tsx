import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'

import type {
  PDFPageProxy,
} from 'pdfjs-dist'

import {
  PdfPageCanvas,
} from '@/features/reader/components/PdfPageCanvas'

const THUMBNAIL_SCALE = 0.25
const THUMBNAIL_RENDER_ROOT_MARGIN =
  '480px 0px'

export interface ReaderThumbnailCanvasProps {
  readonly page: PDFPageProxy
  readonly rotation?: number
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

function createCanvasSlotStyle(
  page: PDFPageProxy,
  rotation: number,
): CSSProperties {
  const viewport =
    page.getViewport({
      scale:
        THUMBNAIL_SCALE,
      rotation:
        normalizeRotation(
          rotation,
        ),
    })

  const width =
    Math.max(
      1,
      Math.floor(
        viewport.width,
      ),
    )

  const height =
    Math.max(
      1,
      Math.floor(
        viewport.height,
      ),
    )

  return {
    width:
      `${width}px`,
    maxWidth:
      '100%',
    height:
      `${height}px`,
  }
}

export function ReaderThumbnailCanvas({
  page,
  rotation = 0,
}: ReaderThumbnailCanvasProps) {
  const slotRef =
    useRef<HTMLSpanElement>(
      null,
    )

  const hasIntersectionObserver =
    typeof IntersectionObserver !==
    'undefined'

  const [
    shouldRenderCanvas,
    setShouldRenderCanvas,
  ] = useState(
    !hasIntersectionObserver,
  )

  const slotStyle =
    useMemo(
      () =>
        createCanvasSlotStyle(
          page,
          rotation,
        ),
      [
        page,
        rotation,
      ],
    )

  useEffect(() => {
    const slot =
      slotRef.current

    if (
      slot === null ||
      typeof IntersectionObserver ===
        'undefined'
    ) {
      return
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          const entry =
            entries[0]

          setShouldRenderCanvas(
            entry?.isIntersecting ??
              false,
          )
        },
        {
          root:
            null,
          rootMargin:
            THUMBNAIL_RENDER_ROOT_MARGIN,
          threshold:
            0,
        },
      )

    observer.observe(
      slot,
    )

    return () => {
      observer.disconnect()
    }
  }, [
    page,
  ])

  return (
    <span
      ref={slotRef}
      className="reader-thumbnails__canvas-slot"
      style={slotStyle}
      aria-hidden="true"
    >
      {shouldRenderCanvas ? (
        <PdfPageCanvas
          page={page}
          scale={
            THUMBNAIL_SCALE
          }
          rotation={
            rotation
          }
          className="reader-thumbnails__canvas"
          aria-hidden="true"
        />
      ) : (
        <span
          className="reader-thumbnails__canvas-placeholder"
          aria-hidden="true"
        />
      )}
    </span>
  )
}
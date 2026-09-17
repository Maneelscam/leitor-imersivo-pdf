import type {
  PDFPageProxy,
} from 'pdfjs-dist'
import {
  renderToStaticMarkup,
} from 'react-dom/server'
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  ReaderThumbnailCanvas,
} from '@/features/reader/components/ReaderThumbnailCanvas'

function createPdfPage():
  PDFPageProxy {
  return {
    pageNumber:
      7,

    getViewport:
      vi.fn(
        () => ({
          width:
            150.9,

          height:
            220.4,
        }),
      ),
  } as unknown as PDFPageProxy
}

describe(
  'ReaderThumbnailCanvas',
  () => {
    afterEach(() => {
      vi.unstubAllGlobals()
      vi.restoreAllMocks()
    })

    it(
      'preserva o espaço da miniatura sem renderizar canvas antes da interseção',
      () => {
        vi.stubGlobal(
          'IntersectionObserver',
          class {},
        )

        const page =
          createPdfPage()

        const html =
          renderToStaticMarkup(
            <ReaderThumbnailCanvas
              page={
                page
              }
              rotation={
                90
              }
            />,
          )

        expect(
          page.getViewport,
        ).toHaveBeenCalledWith({
          scale:
            0.25,

          rotation:
            90,
        })

        expect(
          html,
        ).toContain(
          'reader-thumbnails__canvas-slot',
        )

        expect(
          html,
        ).toContain(
          'reader-thumbnails__canvas-placeholder',
        )

        expect(
          html,
        ).not.toContain(
          '<canvas',
        )
      },
    )

    it(
      'normaliza rotações negativas ao calcular o espaço reservado',
      () => {
        vi.stubGlobal(
          'IntersectionObserver',
          class {},
        )

        const page =
          createPdfPage()

        renderToStaticMarkup(
          <ReaderThumbnailCanvas
            page={
              page
            }
            rotation={
              -90
            }
          />,
        )

        expect(
          page.getViewport,
        ).toHaveBeenCalledWith({
          scale:
            0.25,

          rotation:
            270,
        })
      },
    )
  },
)

import type {
  PDFDocumentProxy,
  PDFPageProxy,
} from 'pdfjs-dist'

import type { GeneratedPdfCover } from '@/models/dtos/GeneratedPdfCover'
import {
  PdfCoverGenerationError,
  PdfCoverGenerationErrorCode,
} from '@/utils/errors/PdfCoverGenerationError'

const COVER_MAX_WIDTH_PIXELS = 480
const COVER_MAX_HEIGHT_PIXELS = 720
const COVER_IMAGE_MIME_TYPE = 'image/webp'
const COVER_IMAGE_QUALITY = 0.86
const FIRST_PAGE_NUMBER = 1

function calculateCoverScale(
  pageWidth: number,
  pageHeight: number,
): number {
  if (
    !Number.isFinite(pageWidth) ||
    !Number.isFinite(pageHeight) ||
    pageWidth <= 0 ||
    pageHeight <= 0
  ) {
    throw new PdfCoverGenerationError(
      PdfCoverGenerationErrorCode.RENDER_FAILED,
      'A primeira página possui dimensões inválidas.',
    )
  }

  const widthScale = COVER_MAX_WIDTH_PIXELS / pageWidth
  const heightScale = COVER_MAX_HEIGHT_PIXELS / pageHeight

  return Math.min(widthScale, heightScale)
}

function createCoverCanvas(
  width: number,
  height: number,
): HTMLCanvasElement {
  if (typeof document === 'undefined') {
    throw new PdfCoverGenerationError(
      PdfCoverGenerationErrorCode.CANVAS_UNAVAILABLE,
      'O recurso de canvas não está disponível neste ambiente.',
    )
  }

  const canvas = document.createElement('canvas')

  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))

  const context = canvas.getContext('2d')

  if (context === null) {
    throw new PdfCoverGenerationError(
      PdfCoverGenerationErrorCode.CANVAS_UNAVAILABLE,
      'O navegador não conseguiu criar o canvas da capa.',
    )
  }

  return canvas
}

function encodeCanvasAsWebp(
  canvas: HTMLCanvasElement,
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob(
        (image) => {
          if (
            image === null ||
            image.type !== COVER_IMAGE_MIME_TYPE
          ) {
            reject(
              new PdfCoverGenerationError(
                PdfCoverGenerationErrorCode.IMAGE_ENCODING_FAILED,
                'Não foi possível converter a capa para o formato WebP.',
              ),
            )

            return
          }

          resolve(image)
        },
        COVER_IMAGE_MIME_TYPE,
        COVER_IMAGE_QUALITY,
      )
    } catch (error) {
      reject(
        new PdfCoverGenerationError(
          PdfCoverGenerationErrorCode.IMAGE_ENCODING_FAILED,
          'O navegador não conseguiu gerar a imagem da capa.',
          {
            cause: error,
          },
        ),
      )
    }
  })
}

async function loadFirstPage(
  document: PDFDocumentProxy,
): Promise<PDFPageProxy> {
  try {
    return await document.getPage(FIRST_PAGE_NUMBER)
  } catch (error) {
    throw new PdfCoverGenerationError(
      PdfCoverGenerationErrorCode.PAGE_LOAD_FAILED,
      'Não foi possível carregar a primeira página do PDF.',
      {
        cause: error,
      },
    )
  }
}

function cleanupPageSafely(page: PDFPageProxy): void {
  try {
    page.cleanup()
  } catch {
    return
  }
}

export class PdfCoverGenerationService {
  async generate(
    document: PDFDocumentProxy,
  ): Promise<GeneratedPdfCover> {
    const page = await loadFirstPage(document)

    try {
      const originalViewport = page.getViewport({
        scale: 1,
      })

      const scale = calculateCoverScale(
        originalViewport.width,
        originalViewport.height,
      )

      const coverViewport = page.getViewport({
        scale,
      })

      const canvas = createCoverCanvas(
        coverViewport.width,
        coverViewport.height,
      )

      try {
        await page.render({
          canvas,
          viewport: coverViewport,
          background: '#ffffff',
        }).promise
      } catch (error) {
        throw new PdfCoverGenerationError(
          PdfCoverGenerationErrorCode.RENDER_FAILED,
          'Não foi possível renderizar a capa do PDF.',
          {
            cause: error,
          },
        )
      }

      const image = await encodeCanvasAsWebp(canvas)

      return {
        image,
        mimeType: COVER_IMAGE_MIME_TYPE,
        width: canvas.width,
        height: canvas.height,
      }
    } finally {
      cleanupPageSafely(page)
    }
  }
}
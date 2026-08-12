import type {
  PDFDocumentProxy,
  PDFPageProxy,
} from 'pdfjs-dist'
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { PdfCoverGenerationService } from '@/services/cover/PdfCoverGenerationService'
import {
  PdfCoverGenerationError,
  PdfCoverGenerationErrorCode,
} from '@/utils/errors/PdfCoverGenerationError'

interface CanvasMock {
  width: number
  height: number
  getContext: ReturnType<typeof vi.fn>
  toBlob: ReturnType<typeof vi.fn>
}

interface PageMock {
  page: PDFPageProxy
  getViewport: ReturnType<typeof vi.fn>
  render: ReturnType<typeof vi.fn>
  cleanup: ReturnType<typeof vi.fn>
}

function createCanvas({
  contextAvailable = true,
  encodedImage = new Blob(
    ['imagem-webp'],
    {
      type: 'image/webp',
    },
  ),
  toBlobError,
}: {
  readonly contextAvailable?: boolean
  readonly encodedImage?: Blob | null
  readonly toBlobError?: unknown
} = {}): CanvasMock {
  const toBlob =
    vi.fn(
      (
        callback: BlobCallback,
        _type?: string,
        _quality?: number,
      ) => {
        if (toBlobError !== undefined) {
          throw toBlobError
        }

        callback(encodedImage)
      },
    )

  return {
    width: 0,
    height: 0,
    getContext:
      vi.fn().mockReturnValue(
        contextAvailable
          ? {}
          : null,
      ),
    toBlob,
  }
}

function installDocument(
  canvas: CanvasMock,
): ReturnType<typeof vi.fn> {
  const createElement =
    vi.fn().mockReturnValue(
      canvas,
    )

  vi.stubGlobal(
    'document',
    {
      createElement,
    },
  )

  return createElement
}

function createPage({
  originalWidth = 600,
  originalHeight = 900,
  renderError,
  cleanupError,
}: {
  readonly originalWidth?: number
  readonly originalHeight?: number
  readonly renderError?: unknown
  readonly cleanupError?: unknown
} = {}): PageMock {
  const getViewport =
    vi.fn(
      ({
        scale,
      }: {
        readonly scale: number
      }) => ({
        width:
          originalWidth * scale,
        height:
          originalHeight * scale,
      }),
    )

  const render =
    vi.fn().mockReturnValue({
      promise:
        renderError === undefined
          ? Promise.resolve()
          : Promise.reject(
              renderError,
            ),
    })

  const cleanup =
    cleanupError === undefined
      ? vi.fn()
      : vi.fn(
          () => {
            throw cleanupError
          },
        )

  const page = {
    getViewport,
    render,
    cleanup,
  } as unknown as PDFPageProxy

  return {
    page,
    getViewport,
    render,
    cleanup,
  }
}

function createDocument(
  page: PDFPageProxy,
): {
  readonly document: PDFDocumentProxy
  readonly getPage: ReturnType<typeof vi.fn>
} {
  const getPage =
    vi.fn().mockResolvedValue(
      page,
    )

  return {
    document: {
      getPage,
    } as unknown as PDFDocumentProxy,
    getPage,
  }
}

describe(
  'PdfCoverGenerationService',
  () => {
    afterEach(
      () => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
      },
    )

    it(
      'gera uma capa WebP respeitando os limites máximos e limpa a página',
      async () => {
        const canvas =
          createCanvas()

        const createElement =
          installDocument(
            canvas,
          )

        const {
          page,
          getViewport,
          render,
          cleanup,
        } =
          createPage({
            originalWidth:
              600,

            originalHeight:
              900,
          })

        const {
          document,
          getPage,
        } =
          createDocument(page)

        const service =
          new PdfCoverGenerationService()

        const result =
          await service.generate(
            document,
          )

        expect(
          getPage,
        ).toHaveBeenCalledWith(
          1,
        )

        expect(
          getViewport,
        ).toHaveBeenNthCalledWith(
          1,
          {
            scale: 1,
          },
        )

        expect(
          getViewport,
        ).toHaveBeenNthCalledWith(
          2,
          {
            scale: 0.8,
          },
        )

        expect(
          createElement,
        ).toHaveBeenCalledWith(
          'canvas',
        )

        expect(canvas.width).toBe(
          480,
        )

        expect(canvas.height).toBe(
          720,
        )

        expect(
          render,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            canvas,
            background:
              '#ffffff',
          }),
        )

        expect(
          canvas.toBlob,
        ).toHaveBeenCalledWith(
          expect.any(
            Function,
          ),
          'image/webp',
          0.86,
        )

        expect(result).toEqual({
          image:
            expect.any(Blob),
          mimeType:
            'image/webp',
          width:
            480,
          height:
            720,
        })

        expect(
          result.image.type,
        ).toBe(
          'image/webp',
        )

        expect(
          cleanup,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      'limita uma página horizontal pela largura máxima',
      async () => {
        const canvas =
          createCanvas()

        installDocument(
          canvas,
        )

        const {
          page,
          getViewport,
        } =
          createPage({
            originalWidth:
              1200,

            originalHeight:
              600,
          })

        const {
          document,
        } =
          createDocument(page)

        const service =
          new PdfCoverGenerationService()

        const result =
          await service.generate(
            document,
          )

        expect(
          getViewport,
        ).toHaveBeenNthCalledWith(
          2,
          {
            scale: 0.4,
          },
        )

        expect(
          result.width,
        ).toBe(
          480,
        )

        expect(
          result.height,
        ).toBe(
          240,
        )
      },
    )

    it(
      'converte falha ao carregar a primeira página em PAGE_LOAD_FAILED',
      async () => {
        const pageError =
          new Error(
            'falha na página',
          )

        const getPage =
          vi.fn().mockRejectedValue(
            pageError,
          )

        const document = {
          getPage,
        } as unknown as PDFDocumentProxy

        const service =
          new PdfCoverGenerationService()

        try {
          await service.generate(
            document,
          )

          throw new Error(
            'A geração deveria falhar.',
          )
        } catch (error) {
          expect(
            error,
          ).toBeInstanceOf(
            PdfCoverGenerationError,
          )

          expect(
            error,
          ).toMatchObject({
            code:
              PdfCoverGenerationErrorCode.PAGE_LOAD_FAILED,
            cause:
              pageError,
          })
        }

        expect(
          getPage,
        ).toHaveBeenCalledWith(
          1,
        )
      },
    )

    it.each([
      [
        0,
        900,
      ],
      [
        600,
        0,
      ],
      [
        Number.NaN,
        900,
      ],
      [
        Number.POSITIVE_INFINITY,
        900,
      ],
    ])(
      'rejeita dimensões inválidas da página (%s x %s)',
      async (
        width,
        height,
      ) => {
        const {
          page,
          cleanup,
        } =
          createPage({
            originalWidth:
              width,

            originalHeight:
              height,
          })

        const {
          document,
        } =
          createDocument(page)

        const service =
          new PdfCoverGenerationService()

        await expect(
          service.generate(
            document,
          ),
        ).rejects.toMatchObject({
          code:
            PdfCoverGenerationErrorCode.RENDER_FAILED,
        })

        expect(
          cleanup,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      'retorna CANVAS_UNAVAILABLE quando document não existe',
      async () => {
        vi.stubGlobal(
          'document',
          undefined,
        )

        const {
          page,
          cleanup,
        } =
          createPage()

        const {
          document,
        } =
          createDocument(page)

        const service =
          new PdfCoverGenerationService()

        await expect(
          service.generate(
            document,
          ),
        ).rejects.toMatchObject({
          code:
            PdfCoverGenerationErrorCode.CANVAS_UNAVAILABLE,
        })

        expect(
          cleanup,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      'retorna CANVAS_UNAVAILABLE quando o contexto 2D não pode ser criado',
      async () => {
        const canvas =
          createCanvas({
            contextAvailable:
              false,
          })

        installDocument(
          canvas,
        )

        const {
          page,
          cleanup,
        } =
          createPage()

        const {
          document,
        } =
          createDocument(page)

        const service =
          new PdfCoverGenerationService()

        await expect(
          service.generate(
            document,
          ),
        ).rejects.toMatchObject({
          code:
            PdfCoverGenerationErrorCode.CANVAS_UNAVAILABLE,
        })

        expect(
          cleanup,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      'converte falha de renderização em RENDER_FAILED',
      async () => {
        const canvas =
          createCanvas()

        installDocument(
          canvas,
        )

        const renderError =
          new Error(
            'falha ao renderizar',
          )

        const {
          page,
          cleanup,
        } =
          createPage({
            renderError,
          })

        const {
          document,
        } =
          createDocument(page)

        const service =
          new PdfCoverGenerationService()

        await expect(
          service.generate(
            document,
          ),
        ).rejects.toMatchObject({
          code:
            PdfCoverGenerationErrorCode.RENDER_FAILED,
          cause:
            renderError,
        })

        expect(
          cleanup,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it.each([
      null,
      new Blob(
        ['png'],
        {
          type:
            'image/png',
        },
      ),
    ])(
      'rejeita imagem codificada inválida',
      async (
        encodedImage,
      ) => {
        const canvas =
          createCanvas({
            encodedImage,
          })

        installDocument(
          canvas,
        )

        const {
          page,
          cleanup,
        } =
          createPage()

        const {
          document,
        } =
          createDocument(page)

        const service =
          new PdfCoverGenerationService()

        await expect(
          service.generate(
            document,
          ),
        ).rejects.toMatchObject({
          code:
            PdfCoverGenerationErrorCode.IMAGE_ENCODING_FAILED,
        })

        expect(
          cleanup,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      'converte exceção do toBlob em IMAGE_ENCODING_FAILED',
      async () => {
        const encodingError =
          new Error(
            'falha no toBlob',
          )

        const canvas =
          createCanvas({
            toBlobError:
              encodingError,
          })

        installDocument(
          canvas,
        )

        const {
          page,
          cleanup,
        } =
          createPage()

        const {
          document,
        } =
          createDocument(page)

        const service =
          new PdfCoverGenerationService()

        await expect(
          service.generate(
            document,
          ),
        ).rejects.toMatchObject({
          code:
            PdfCoverGenerationErrorCode.IMAGE_ENCODING_FAILED,
          cause:
            encodingError,
        })

        expect(
          cleanup,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      'não deixa falha no cleanup invalidar uma capa já gerada',
      async () => {
        const canvas =
          createCanvas()

        installDocument(
          canvas,
        )

        const {
          page,
          cleanup,
        } =
          createPage({
            cleanupError:
              new Error(
                'falha no cleanup',
              ),
          })

        const {
          document,
        } =
          createDocument(page)

        const service =
          new PdfCoverGenerationService()

        await expect(
          service.generate(
            document,
          ),
        ).resolves.toMatchObject({
          mimeType:
            'image/webp',
          width:
            480,
          height:
            720,
        })

        expect(
          cleanup,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )
  },
)
import type {
  PDFDocumentProxy,
} from 'pdfjs-dist'
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  LoadPdfOutlineController,
} from '@/controllers/reader/LoadPdfOutlineController'
import type {
  PdfOutlineItem,
} from '@/models/dtos/PdfOutlineItem'
import type {
  PdfOutlineService,
} from '@/services/pdf/PdfOutlineService'

function createDocument(): PDFDocumentProxy {
  return {
    numPages: 20,
  } as unknown as PDFDocumentProxy
}

function createOutline():
  readonly PdfOutlineItem[] {
  return [
    {
      id:
        'outline-0',

      title:
        'Introdução',

      pageNumber:
        1,

      children: [],
    },

    {
      id:
        'outline-1',

      title:
        'Capítulo 1',

      pageNumber:
        5,

      children: [
        {
          id:
            'outline-1-0',

          title:
            'Seção 1.1',

          pageNumber:
            6,

          children: [],
        },
      ],
    },
  ]
}

describe('LoadPdfOutlineController', () => {
  it('delega o carregamento do sumário ao PdfOutlineService', async () => {
    const document =
      createDocument()

    const outline =
      createOutline()

    const load =
      vi.fn().mockResolvedValue(
        outline,
      )

    const service = {
      load,
    } as unknown as PdfOutlineService

    const controller =
      new LoadPdfOutlineController(
        service,
      )

    await expect(
      controller.execute(
        document,
      ),
    ).resolves.toBe(
      outline,
    )

    expect(
      load,
    ).toHaveBeenCalledTimes(
      1,
    )

    expect(
      load,
    ).toHaveBeenCalledWith(
      document,
    )
  })

  it('propaga a falha retornada pelo PdfOutlineService', async () => {
    const loadError =
      new Error(
        'falha ao carregar sumário',
      )

    const load =
      vi.fn().mockRejectedValue(
        loadError,
      )

    const service = {
      load,
    } as unknown as PdfOutlineService

    const controller =
      new LoadPdfOutlineController(
        service,
      )

    await expect(
      controller.execute(
        createDocument(),
      ),
    ).rejects.toBe(
      loadError,
    )
  })
})
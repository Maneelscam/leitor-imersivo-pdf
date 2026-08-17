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
  PdfOutlineService,
} from '@/services/pdf/PdfOutlineService'

interface CreateDocumentOptions {
  readonly numPages?: number

  readonly outline?:
    unknown[] | null

  readonly getDestination?:
    (
      destinationId: string,
    ) => Promise<unknown>

  readonly getPageIndex?:
    (
      reference: unknown,
    ) => Promise<number>
}

function createDocument({
  numPages = 20,
  outline = [],
  getDestination,
  getPageIndex,
}: CreateDocumentOptions = {}): {
  readonly document:
    PDFDocumentProxy

  readonly getOutline:
    ReturnType<typeof vi.fn>

  readonly getDestination:
    ReturnType<typeof vi.fn>

  readonly getPageIndex:
    ReturnType<typeof vi.fn>
} {
  const getOutline =
    vi.fn().mockResolvedValue(
      outline,
    )

  const getDestinationMock =
    vi.fn(
      getDestination ??
        (async () => null),
    )

  const getPageIndexMock =
    vi.fn(
      getPageIndex ??
        (async () => 0),
    )

  const document = {
    numPages,
    getOutline,
    getDestination:
      getDestinationMock,
    getPageIndex:
      getPageIndexMock,
  } as unknown as PDFDocumentProxy

  return {
    document,
    getOutline,
    getDestination:
      getDestinationMock,
    getPageIndex:
      getPageIndexMock,
  }
}

describe('PdfOutlineService', () => {
  it('retorna lista vazia quando o PDF não possui sumário', async () => {
    const {
      document,
      getOutline,
    } = createDocument({
      outline: null,
    })

    const service =
      new PdfOutlineService()

    await expect(
      service.load(
        document,
      ),
    ).resolves.toEqual([])

    expect(
      getOutline,
    ).toHaveBeenCalledTimes(
      1,
    )
  })

  it('retorna lista vazia quando o sumário está vazio', async () => {
    const {
      document,
    } = createDocument({
      outline: [],
    })

    const service =
      new PdfOutlineService()

    await expect(
      service.load(
        document,
      ),
    ).resolves.toEqual([])
  })

  it('resolve destino numérico para número de página', async () => {
    const {
      document,
      getDestination,
      getPageIndex,
    } = createDocument({
      numPages: 10,

      outline: [
        {
          title:
            'Introdução',

          dest: [
            2,
          ],

          items: [],
        },
      ],
    })

    const service =
      new PdfOutlineService()

    await expect(
      service.load(
        document,
      ),
    ).resolves.toEqual([
      {
        id:
          'outline-0',

        title:
          'Introdução',

        pageNumber:
          3,

        children: [],
      },
    ])

    expect(
      getDestination,
    ).not.toHaveBeenCalled()

    expect(
      getPageIndex,
    ).not.toHaveBeenCalled()
  })

  it('resolve referência interna de página', async () => {
    const pageReference = {
      num: 17,
      gen: 0,
    }

    const {
      document,
      getPageIndex,
    } = createDocument({
      numPages: 12,

      outline: [
        {
          title:
            'Capítulo 1',

          dest: [
            pageReference,
          ],

          items: [],
        },
      ],

      getPageIndex:
        async (
          reference,
        ) => {
          expect(
            reference,
          ).toBe(
            pageReference,
          )

          return 4
        },
    })

    const service =
      new PdfOutlineService()

    const result =
      await service.load(
        document,
      )

    expect(
      result,
    ).toEqual([
      {
        id:
          'outline-0',

        title:
          'Capítulo 1',

        pageNumber:
          5,

        children: [],
      },
    ])

    expect(
      getPageIndex,
    ).toHaveBeenCalledTimes(
      1,
    )
  })

  it('resolve destino nomeado do PDF', async () => {
    const {
      document,
      getDestination,
    } = createDocument({
      numPages: 20,

      outline: [
        {
          title:
            'Conclusão',

          dest:
            'conclusao',

          items: [],
        },
      ],

      getDestination:
        async (
          destinationId,
        ) => {
          expect(
            destinationId,
          ).toBe(
            'conclusao',
          )

          return [
            14,
          ]
        },
    })

    const service =
      new PdfOutlineService()

    await expect(
      service.load(
        document,
      ),
    ).resolves.toEqual([
      {
        id:
          'outline-0',

        title:
          'Conclusão',

        pageNumber:
          15,

        children: [],
      },
    ])

    expect(
      getDestination,
    ).toHaveBeenCalledTimes(
      1,
    )
  })

  it('preserva a hierarquia de capítulos e subcapítulos', async () => {
    const {
      document,
    } = createDocument({
      numPages: 30,

      outline: [
        {
          title:
            'Capítulo 1',

          dest: [
            0,
          ],

          items: [
            {
              title:
                'Seção 1.1',

              dest: [
                2,
              ],

              items: [],
            },

            {
              title:
                'Seção 1.2',

              dest: [
                5,
              ],

              items: [
                {
                  title:
                    'Tópico 1.2.1',

                  dest: [
                    7,
                  ],

                  items: [],
                },
              ],
            },
          ],
        },

        {
          title:
            'Capítulo 2',

          dest: [
            10,
          ],

          items: [],
        },
      ],
    })

    const service =
      new PdfOutlineService()

    await expect(
      service.load(
        document,
      ),
    ).resolves.toEqual([
      {
        id:
          'outline-0',

        title:
          'Capítulo 1',

        pageNumber:
          1,

        children: [
          {
            id:
              'outline-0-0',

            title:
              'Seção 1.1',

            pageNumber:
              3,

            children: [],
          },

          {
            id:
              'outline-0-1',

            title:
              'Seção 1.2',

            pageNumber:
              6,

            children: [
              {
                id:
                  'outline-0-1-0',

                title:
                  'Tópico 1.2.1',

                pageNumber:
                  8,

                children: [],
              },
            ],
          },
        ],
      },

      {
        id:
          'outline-1',

        title:
          'Capítulo 2',

        pageNumber:
          11,

        children: [],
      },
    ])
  })

  it('normaliza título vazio', async () => {
    const {
      document,
    } = createDocument({
      outline: [
        {
          title:
            '   ',

          dest: [
            0,
          ],

          items: [],
        },
      ],
    })

    const service =
      new PdfOutlineService()

    const result =
      await service.load(
        document,
      )

    expect(
      result[0]?.title,
    ).toBe(
      'Item sem título',
    )
  })

  it('mantém item com página nula quando o destino nomeado é inválido', async () => {
    const {
      document,
    } = createDocument({
      numPages: 10,

      outline: [
        {
          title:
            'Destino inválido',

          dest:
            'destino-inexistente',

          items: [],
        },

        {
          title:
            'Destino válido',

          dest: [
            4,
          ],

          items: [],
        },
      ],

      getDestination:
        async () => {
          throw new Error(
            'Destino não encontrado.',
          )
        },
    })

    const service =
      new PdfOutlineService()

    await expect(
      service.load(
        document,
      ),
    ).resolves.toEqual([
      {
        id:
          'outline-0',

        title:
          'Destino inválido',

        pageNumber:
          null,

        children: [],
      },

      {
        id:
          'outline-1',

        title:
          'Destino válido',

        pageNumber:
          5,

        children: [],
      },
    ])
  })

  it('mantém item com página nula quando a referência interna não pode ser resolvida', async () => {
    const invalidReference = {
      num: 999,
      gen: 0,
    }

    const {
      document,
    } = createDocument({
      outline: [
        {
          title:
            'Referência inválida',

          dest: [
            invalidReference,
          ],

          items: [],
        },
      ],

      getPageIndex:
        async () => {
          throw new Error(
            'Referência inválida.',
          )
        },
    })

    const service =
      new PdfOutlineService()

    await expect(
      service.load(
        document,
      ),
    ).resolves.toEqual([
      {
        id:
          'outline-0',

        title:
          'Referência inválida',

        pageNumber:
          null,

        children: [],
      },
    ])
  })

  it('usa cache para o mesmo documento PDF', async () => {
    const {
      document,
      getOutline,
    } = createDocument({
      outline: [
        {
          title:
            'Capítulo único',

          dest: [
            0,
          ],

          items: [],
        },
      ],
    })

    const service =
      new PdfOutlineService()

    const firstResult =
      await service.load(
        document,
      )

    const secondResult =
      await service.load(
        document,
      )

    expect(
      firstResult,
    ).toBe(
      secondResult,
    )

    expect(
      getOutline,
    ).toHaveBeenCalledTimes(
      1,
    )
  })

  it('remove o cache quando o carregamento do outline falha', async () => {
    const getOutline =
      vi.fn()
        .mockRejectedValueOnce(
          new Error(
            'Falha temporária.',
          ),
        )
        .mockResolvedValueOnce(
          [
            {
              title:
                'Recuperado',

              dest: [
                0,
              ],

              items: [],
            },
          ],
        )

    const document = {
      numPages: 10,

      getOutline,

      getDestination:
        vi.fn(),

      getPageIndex:
        vi.fn(),
    } as unknown as PDFDocumentProxy

    const service =
      new PdfOutlineService()

    await expect(
      service.load(
        document,
      ),
    ).rejects.toThrow(
      'Falha temporária.',
    )

    await expect(
      service.load(
        document,
      ),
    ).resolves.toEqual([
      {
        id:
          'outline-0',

        title:
          'Recuperado',

        pageNumber:
          1,

        children: [],
      },
    ])

    expect(
      getOutline,
    ).toHaveBeenCalledTimes(
      2,
    )
  })
})
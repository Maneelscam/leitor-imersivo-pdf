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
  PdfMetadataService,
} from '@/services/metadata/PdfMetadataService'

function createDocument({
  numPages = 10,
  fingerprints = [
    'fingerprint-1',
  ],
  info = {},
  metadata = null,
  getMetadataError,
}: {
  readonly numPages?: number
  readonly fingerprints?: readonly string[]
  readonly info?: unknown
  readonly metadata?: unknown
  readonly getMetadataError?: unknown
} = {}): PDFDocumentProxy {
  const getMetadata =
    getMetadataError === undefined
      ? vi.fn().mockResolvedValue({
          info,
          metadata,
        })
      : vi.fn().mockRejectedValue(
          getMetadataError,
        )

  return {
    numPages,
    fingerprints,
    getMetadata,
  } as unknown as PDFDocumentProxy
}

describe(
  'PdfMetadataService',
  () => {
    const service =
      new PdfMetadataService()

    it(
      'extrai título e autor do dicionário de informações',
      async () => {
        const document =
          createDocument({
            numPages:
              42,

            fingerprints: [
              ' fingerprint-principal ',
            ],

            info: {
              Title:
                '  Meu   Livro  ',

              Author:
                '  Autor   Teste ',
            },
          })

        await expect(
          service.extract(
            document,
          ),
        ).resolves.toEqual({
          title:
            'Meu Livro',

          author:
            'Autor Teste',

          totalPages:
            42,

          fingerprint:
            'fingerprint-principal',
        })
      },
    )

    it(
      'usa XMP quando título e autor não existem no dicionário de informações',
      async () => {
        const values =
          new Map<string, unknown>([
            [
              'dc:title',
              'Título XMP',
            ],
            [
              'dc:creator',
              'Autor XMP',
            ],
          ])

        const metadata = {
          get:
            vi.fn(
              (key: string) =>
                values.get(key),
            ),
        }

        const document =
          createDocument({
            info: {},
            metadata,
          })

        const result =
          await service.extract(
            document,
          )

        expect(result).toMatchObject({
          title:
            'Título XMP',

          author:
            'Autor XMP',
        })
      },
    )

    it(
      'tenta as chaves XMP alternativas quando as primeiras estão vazias',
      async () => {
        const metadata = {
          get:
            vi.fn(
              (key: string) => {
                switch (key) {
                  case 'dc:title':
                  case 'dc:creator':
                    return '   '

                  case 'pdf:title':
                    return 'Título PDF'

                  case 'pdf:author':
                    return 'Autor PDF'

                  default:
                    return null
                }
              },
            ),
        }

        const result =
          await service.extract(
            createDocument({
              info: {},
              metadata,
            }),
          )

        expect(result).toMatchObject({
          title:
            'Título PDF',

          author:
            'Autor PDF',
        })
      },
    )

    it(
      'prioriza o dicionário de informações sobre XMP',
      async () => {
        const metadata = {
          get:
            vi.fn().mockReturnValue(
              'Valor XMP',
            ),
        }

        const result =
          await service.extract(
            createDocument({
              info: {
                Title:
                  'Título Info',

                Author:
                  'Autor Info',
              },

              metadata,
            }),
          )

        expect(result).toMatchObject({
          title:
            'Título Info',

          author:
            'Autor Info',
        })
      },
    )

    it(
      'retorna título e autor null quando getMetadata falha',
      async () => {
        const result =
          await service.extract(
            createDocument({
              numPages:
                7,

              fingerprints: [
                'fingerprint-ok',
              ],

              getMetadataError:
                new Error(
                  'falha nos metadados',
                ),
            }),
          )

        expect(result).toEqual({
          title: null,
          author: null,
          totalPages: 7,
          fingerprint:
            'fingerprint-ok',
        })
      },
    )

    it(
      'retorna fingerprint null quando o primeiro fingerprint é vazio',
      async () => {
        const result =
          await service.extract(
            createDocument({
              fingerprints: [
                '   ',
              ],
            }),
          )

        expect(
          result.fingerprint,
        ).toBeNull()
      },
    )

    it(
      'ignora erros isolados ao consultar chaves XMP',
      async () => {
        const metadata = {
          get:
            vi.fn(
              (key: string) => {
                if (
                  key ===
                  'dc:title'
                ) {
                  throw new Error(
                    'falha isolada',
                  )
                }

                if (
                  key ===
                  'pdf:title'
                ) {
                  return 'Título recuperado'
                }

                return null
              },
            ),
        }

        const result =
          await service.extract(
            createDocument({
              info: {},
              metadata,
            }),
          )

        expect(
          result.title,
        ).toBe(
          'Título recuperado',
        )
      },
    )
  },
)
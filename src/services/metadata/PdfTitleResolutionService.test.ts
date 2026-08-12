import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  PdfTitleResolutionService,
} from '@/services/metadata/PdfTitleResolutionService'

describe(
  'PdfTitleResolutionService',
  () => {
    const service =
      new PdfTitleResolutionService()

    it(
      'usa o título dos metadados quando ele é válido',
      () => {
        expect(
          service.resolve(
            '  Meu   Livro  ',
            'arquivo.pdf',
          ),
        ).toBe(
          'Meu Livro',
        )
      },
    )

    it(
      'usa o nome do arquivo quando o título dos metadados é null',
      () => {
        expect(
          service.resolve(
            null,
            'meu-arquivo.pdf',
          ),
        ).toBe(
          'meu-arquivo',
        )
      },
    )

    it(
      'usa o nome do arquivo quando o título dos metadados fica vazio após normalização',
      () => {
        expect(
          service.resolve(
            '   ',
            'fallback.pdf',
          ),
        ).toBe(
          'fallback',
        )
      },
    )

    it(
      'remove a extensão PDF sem diferenciar maiúsculas de minúsculas',
      () => {
        expect(
          service.resolve(
            null,
            'Documento.PDF',
          ),
        ).toBe(
          'Documento',
        )
      },
    )

    it(
      'normaliza espaços no título derivado do nome do arquivo',
      () => {
        expect(
          service.resolve(
            null,
            '  Meu   Documento  .pdf',
          ),
        ).toBe(
          'Meu Documento',
        )
      },
    )

    it(
      'usa o título padrão quando metadados e nome do arquivo não produzem título',
      () => {
        expect(
          service.resolve(
            '   ',
            '.pdf',
          ),
        ).toBe(
          'Documento sem título',
        )
      },
    )
  },
)
import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  PdfFileValidationService,
} from '@/services/file/PdfFileValidationService'
import {
  PdfFileValidationError,
  PdfFileValidationErrorCode,
} from '@/utils/errors/PdfFileValidationError'

function createFile({
  name = 'arquivo.pdf',
  type = 'application/pdf',
  content = '%PDF-1.7 conteúdo',
}: {
  readonly name?: string
  readonly type?: string
  readonly content?: string
} = {}): File {
  return new File(
    [content],
    name,
    {
      type,
    },
  )
}

describe(
  'PdfFileValidationService',
  () => {
    const service =
      new PdfFileValidationService()

    it(
      'aceita um PDF válido',
      async () => {
        await expect(
          service.validate(
            createFile(),
          ),
        ).resolves.toBeUndefined()
      },
    )

    it(
      'aceita extensão PDF sem diferenciar maiúsculas de minúsculas',
      async () => {
        await expect(
          service.validate(
            createFile({
              name:
                'ARQUIVO.PDF',
            }),
          ),
        ).resolves.toBeUndefined()
      },
    )

    it(
      'aceita MIME type vazio quando a extensão e a assinatura são válidas',
      async () => {
        await expect(
          service.validate(
            createFile({
              type: '',
            }),
          ),
        ).resolves.toBeUndefined()
      },
    )

    it(
      'rejeita arquivo vazio',
      async () => {
        const file =
          new File(
            [],
            'vazio.pdf',
            {
              type:
                'application/pdf',
            },
          )

        const promise =
          service.validate(file)

        await expect(
          promise,
        ).rejects.toMatchObject({
          name:
            'PdfFileValidationError',
          code:
            PdfFileValidationErrorCode.EMPTY_FILE,
        })

        await expect(
          promise,
        ).rejects.toBeInstanceOf(
          PdfFileValidationError,
        )
      },
    )

    it(
      'rejeita arquivo sem extensão PDF',
      async () => {
        await expect(
          service.validate(
            createFile({
              name:
                'arquivo.txt',
            }),
          ),
        ).rejects.toMatchObject({
          code:
            PdfFileValidationErrorCode.INVALID_EXTENSION,
        })
      },
    )

    it(
      'rejeita MIME type incompatível',
      async () => {
        await expect(
          service.validate(
            createFile({
              type:
                'text/plain',
            }),
          ),
        ).rejects.toMatchObject({
          code:
            PdfFileValidationErrorCode.INVALID_MIME_TYPE,
        })
      },
    )

    it(
      'rejeita conteúdo sem assinatura PDF',
      async () => {
        await expect(
          service.validate(
            createFile({
              content:
                'conteúdo que não é PDF',
            }),
          ),
        ).rejects.toMatchObject({
          code:
            PdfFileValidationErrorCode.INVALID_SIGNATURE,
        })
      },
    )

    it(
      'encontra a assinatura PDF dentro da janela inicial de leitura',
      async () => {
        await expect(
          service.validate(
            createFile({
              content:
                'prefixo antes da assinatura %PDF-1.7 conteúdo',
            }),
          ),
        ).resolves.toBeUndefined()
      },
    )
  },
)
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  FileHashService,
} from '@/services/file/FileHashService'
import {
  FileHashError,
  FileHashErrorCode,
} from '@/utils/errors/FileHashError'

describe(
  'FileHashService',
  () => {
    afterEach(
      () => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
      },
    )

    it(
      'gera um hash SHA-256 estável com o prefixo esperado',
      async () => {
        const service =
          new FileHashService()

        const blob =
          new Blob(
            ['abc'],
          )

        await expect(
          service.generate(blob),
        ).resolves.toBe(
          'sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
        )
      },
    )

    it(
      'gera hashes diferentes para conteúdos diferentes',
      async () => {
        const service =
          new FileHashService()

        const firstHash =
          await service.generate(
            new Blob(
              ['primeiro'],
            ),
          )

        const secondHash =
          await service.generate(
            new Blob(
              ['segundo'],
            ),
          )

        expect(
          firstHash,
        ).not.toBe(
          secondHash,
        )
      },
    )

    it(
      'retorna CRYPTO_UNAVAILABLE quando SubtleCrypto não está disponível',
      async () => {
        vi.stubGlobal(
          'crypto',
          {},
        )

        const service =
          new FileHashService()

        const promise =
          service.generate(
            new Blob(
              ['conteúdo'],
            ),
          )

        await expect(
          promise,
        ).rejects.toMatchObject({
          name:
            'FileHashError',
          code:
            FileHashErrorCode.CRYPTO_UNAVAILABLE,
        })

        await expect(
          promise,
        ).rejects.toBeInstanceOf(
          FileHashError,
        )
      },
    )

    it(
      'converte falha de leitura do arquivo em FILE_READ_FAILED',
      async () => {
        const readError =
          new Error(
            'falha de leitura',
          )

        const blob = {
          arrayBuffer:
            vi.fn().mockRejectedValue(
              readError,
            ),
        } as unknown as Blob

        const service =
          new FileHashService()

        try {
          await service.generate(
            blob,
          )

          throw new Error(
            'A execução deveria falhar.',
          )
        } catch (error) {
          expect(
            error,
          ).toBeInstanceOf(
            FileHashError,
          )

          expect(
            error,
          ).toMatchObject({
            code:
              FileHashErrorCode.FILE_READ_FAILED,
            cause:
              readError,
          })
        }
      },
    )

    it(
      'converte falha do digest em HASH_GENERATION_FAILED',
      async () => {
        const digestError =
          new Error(
            'falha no digest',
          )

        const digest =
          vi.fn().mockRejectedValue(
            digestError,
          )

        vi.stubGlobal(
          'crypto',
          {
            subtle: {
              digest,
            },
          },
        )

        const service =
          new FileHashService()

        try {
          await service.generate(
            new Blob(
              ['conteúdo'],
            ),
          )

          throw new Error(
            'A execução deveria falhar.',
          )
        } catch (error) {
          expect(
            error,
          ).toBeInstanceOf(
            FileHashError,
          )

          expect(
            error,
          ).toMatchObject({
            code:
              FileHashErrorCode.HASH_GENERATION_FAILED,
            cause:
              digestError,
          })
        }
      },
    )
  },
)
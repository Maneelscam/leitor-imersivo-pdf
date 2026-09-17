import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  StoragePersistenceRequestResult,
  StoragePersistenceService,
  StoragePersistenceStatus,
  type StoragePersistencePort,
} from '@/services/storage/StoragePersistenceService'

function createPort(
  overrides:
    Partial<StoragePersistencePort> = {},
): StoragePersistencePort {
  return {
    persisted:
      vi.fn().mockResolvedValue(false),

    persist:
      vi.fn().mockResolvedValue(true),

    estimate:
      vi.fn().mockResolvedValue({
        usage: 25,
        quota: 100,
      }),

    ...overrides,
  }
}

describe(
  'StoragePersistenceService',
  () => {
    it(
      'carrega persistência e estimativa de armazenamento',
      async () => {
        const service =
          new StoragePersistenceService(
            createPort({
              persisted:
                vi.fn().mockResolvedValue(true),

              estimate:
                vi.fn().mockResolvedValue({
                  usage: 40,
                  quota: 200,
                }),
            }),
          )

        service.initialize()
        await service.refresh()

        expect(
          service.getSnapshot(),
        ).toEqual({
          status:
            StoragePersistenceStatus.READY,
          isSupported: true,
          isPersistent: true,
          usageBytes: 40,
          quotaBytes: 200,
        })
      },
    )

    it(
      'representa ambiente sem suporte sem lançar erro',
      () => {
        const service =
          new StoragePersistenceService(null)

        service.initialize()

        expect(
          service.getSnapshot(),
        ).toEqual({
          status:
            StoragePersistenceStatus.READY,
          isSupported: false,
          isPersistent: false,
          usageBytes: null,
          quotaBytes: null,
        })
      },
    )

    it(
      'solicita armazenamento persistente e atualiza o estado',
      async () => {
        let persisted = false

        const port =
          createPort({
            persisted:
              vi.fn(
                async () =>
                  persisted,
              ),

            persist:
              vi.fn(
                async () => {
                  persisted = true
                  return true
                },
              ),
          })

        const service =
          new StoragePersistenceService(port)

        service.initialize()
        await service.refresh()

        await expect(
          service.requestPersistence(),
        ).resolves.toBe(
          StoragePersistenceRequestResult.GRANTED,
        )

        expect(
          service.getSnapshot().isPersistent,
        ).toBe(true)
      },
    )

    it(
      'mantém o estado não persistente quando o navegador nega a solicitação',
      async () => {
        const service =
          new StoragePersistenceService(
            createPort({
              persist:
                vi.fn().mockResolvedValue(false),
            }),
          )

        service.initialize()
        await service.refresh()

        await expect(
          service.requestPersistence(),
        ).resolves.toBe(
          StoragePersistenceRequestResult.DENIED,
        )

        expect(
          service.getSnapshot().isPersistent,
        ).toBe(false)
      },
    )

    it(
      'não solicita novamente quando o armazenamento já é persistente',
      async () => {
        const persist =
          vi.fn().mockResolvedValue(true)

        const service =
          new StoragePersistenceService(
            createPort({
              persisted:
                vi.fn().mockResolvedValue(true),
              persist,
            }),
          )

        service.initialize()
        await service.refresh()

        await expect(
          service.requestPersistence(),
        ).resolves.toBe(
          StoragePersistenceRequestResult.ALREADY_PERSISTENT,
        )

        expect(
          persist,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'normaliza estimativas inválidas',
      async () => {
        const service =
          new StoragePersistenceService(
            createPort({
              estimate:
                vi.fn().mockResolvedValue({
                  usage: Number.NaN,
                  quota: -1,
                }),
            }),
          )

        service.initialize()
        await service.refresh()

        expect(
          service.getSnapshot().usageBytes,
        ).toBeNull()

        expect(
          service.getSnapshot().quotaBytes,
        ).toBeNull()
      },
    )

    it(
      'entra em estado de erro quando a consulta ao navegador falha',
      async () => {
        const service =
          new StoragePersistenceService(
            createPort({
              persisted:
                vi.fn().mockRejectedValue(
                  new Error('falha'),
                ),
            }),
          )

        service.initialize()
        await service.refresh()

        expect(
          service.getSnapshot().status,
        ).toBe(
          StoragePersistenceStatus.ERROR,
        )
      },
    )
  },
)

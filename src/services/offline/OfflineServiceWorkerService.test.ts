import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  OfflineServiceWorkerService,
  type ServiceWorkerRegistrationPort,
} from '@/services/offline/OfflineServiceWorkerService'

function createRegistrationPort() {
  const register =
    vi.fn<
      ServiceWorkerRegistrationPort['register']
    >()
      .mockResolvedValue(
        undefined,
      )

  return {
    register,
    port: {
      register,
    } satisfies
      ServiceWorkerRegistrationPort,
  }
}

describe(
  'OfflineServiceWorkerService',
  () => {
    it(
      'registra o service worker no escopo da aplicação',
      async () => {
        const {
          register,
          port,
        } =
          createRegistrationPort()

        const service =
          new OfflineServiceWorkerService(
            {
              enabled: true,
              baseUrl:
                '/leitor-imersivo-pdf/',
              serviceWorker:
                port,
            },
          )

        await service.register()

        expect(
          register,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          register,
        ).toHaveBeenCalledWith(
          '/leitor-imersivo-pdf/sw.js',
          {
            scope:
              '/leitor-imersivo-pdf/',
          },
        )
      },
    )

    it(
      'normaliza base sem barra final',
      async () => {
        const {
          register,
          port,
        } =
          createRegistrationPort()

        const service =
          new OfflineServiceWorkerService(
            {
              enabled: true,
              baseUrl:
                '/leitor-imersivo-pdf',
              serviceWorker:
                port,
            },
          )

        await service.register()

        expect(
          register,
        ).toHaveBeenCalledWith(
          '/leitor-imersivo-pdf/sw.js',
          {
            scope:
              '/leitor-imersivo-pdf/',
          },
        )
      },
    )

    it(
      'não registra fora do build de produção',
      async () => {
        const {
          register,
          port,
        } =
          createRegistrationPort()

        const service =
          new OfflineServiceWorkerService(
            {
              enabled: false,
              baseUrl: '/',
              serviceWorker:
                port,
            },
          )

        await service.register()

        expect(
          register,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'não falha quando o navegador não oferece service worker',
      async () => {
        const service =
          new OfflineServiceWorkerService(
            {
              enabled: true,
              baseUrl: '/',
              serviceWorker:
                null,
            },
          )

        await expect(
          service.register(),
        ).resolves.toBeUndefined()
      },
    )

    it(
      'não interrompe o aplicativo quando o registro falha',
      async () => {
        const register =
          vi.fn<
            ServiceWorkerRegistrationPort['register']
          >()
            .mockRejectedValue(
              new Error(
                'registration failed',
              ),
            )

        const service =
          new OfflineServiceWorkerService(
            {
              enabled: true,
              baseUrl: '/',
              serviceWorker: {
                register,
              },
            },
          )

        await expect(
          service.register(),
        ).resolves.toBeUndefined()
      },
    )
  },
)

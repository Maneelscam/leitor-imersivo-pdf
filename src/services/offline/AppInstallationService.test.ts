import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  AppInstallationResult,
  AppInstallationService,
  type AppInstallationPort,
  type AppInstallationPromptEvent,
} from '@/services/offline/AppInstallationService'

function createPort(
  standalone = false,
) {
  let beforeInstallPromptListener:
    ((
      event:
        AppInstallationPromptEvent,
    ) => void) | null =
      null

  let appInstalledListener:
    (() => void) | null =
      null

  const port:
    AppInstallationPort = {
      isStandalone:
        () => standalone,

      addBeforeInstallPromptListener:
        (listener) => {
          beforeInstallPromptListener =
            listener
        },

      removeBeforeInstallPromptListener:
        (listener) => {
          if (
            beforeInstallPromptListener ===
            listener
          ) {
            beforeInstallPromptListener =
              null
          }
        },

      addAppInstalledListener:
        (listener) => {
          appInstalledListener =
            listener
        },

      removeAppInstalledListener:
        (listener) => {
          if (
            appInstalledListener ===
            listener
          ) {
            appInstalledListener =
              null
          }
        },
    }

  return {
    port,

    dispatchBeforeInstallPrompt:
      (
        event:
          AppInstallationPromptEvent,
      ) => {
        beforeInstallPromptListener?.(
          event,
        )
      },

    dispatchAppInstalled:
      () => {
        appInstalledListener?.()
      },

    hasBeforeInstallPromptListener:
      () =>
        beforeInstallPromptListener !==
        null,
  }
}

function createPromptEvent(
  outcome:
    | 'accepted'
    | 'dismissed',
) {
  const preventDefault =
    vi.fn()

  const prompt =
    vi.fn()
      .mockResolvedValue(
        undefined,
      )

  const event:
    AppInstallationPromptEvent = {
      preventDefault,
      prompt,
      userChoice:
        Promise.resolve({
          outcome,
        }),
    }

  return {
    event,
    preventDefault,
    prompt,
  }
}

describe(
  'AppInstallationService',
  () => {
    it(
      'começa indisponível e captura o evento de instalação',
      () => {
        const {
          port,
          dispatchBeforeInstallPrompt,
        } =
          createPort()

        const service =
          new AppInstallationService(
            port,
          )

        service.initialize()

        const {
          event,
          preventDefault,
        } =
          createPromptEvent(
            'accepted',
          )

        dispatchBeforeInstallPrompt(
          event,
        )

        expect(
          preventDefault,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          service.getSnapshot(),
        ).toEqual({
          canInstall: true,
          isInstalled: false,
        })
      },
    )

    it(
      'instala quando o usuário aceita o prompt',
      async () => {
        const {
          port,
          dispatchBeforeInstallPrompt,
        } =
          createPort()

        const service =
          new AppInstallationService(
            port,
          )

        service.initialize()

        const {
          event,
          prompt,
        } =
          createPromptEvent(
            'accepted',
          )

        dispatchBeforeInstallPrompt(
          event,
        )

        await expect(
          service
            .requestInstallation(),
        ).resolves.toBe(
          AppInstallationResult
            .ACCEPTED,
        )

        expect(
          prompt,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          service.getSnapshot(),
        ).toEqual({
          canInstall: false,
          isInstalled: true,
        })
      },
    )

    it(
      'trata cancelamento sem marcar o aplicativo como instalado',
      async () => {
        const {
          port,
          dispatchBeforeInstallPrompt,
        } =
          createPort()

        const service =
          new AppInstallationService(
            port,
          )

        service.initialize()

        const {
          event,
        } =
          createPromptEvent(
            'dismissed',
          )

        dispatchBeforeInstallPrompt(
          event,
        )

        await expect(
          service
            .requestInstallation(),
        ).resolves.toBe(
          AppInstallationResult
            .DISMISSED,
        )

        expect(
          service.getSnapshot(),
        ).toEqual({
          canInstall: false,
          isInstalled: false,
        })
      },
    )

    it(
      'reconhece execução em modo standalone',
      () => {
        const {
          port,
          hasBeforeInstallPromptListener,
        } =
          createPort(
            true,
          )

        const service =
          new AppInstallationService(
            port,
          )

        service.initialize()

        expect(
          service.getSnapshot(),
        ).toEqual({
          canInstall: false,
          isInstalled: true,
        })

        expect(
          hasBeforeInstallPromptListener(),
        ).toBe(
          false,
        )
      },
    )

    it(
      'atualiza o estado quando o navegador confirma a instalação',
      () => {
        const {
          port,
          dispatchBeforeInstallPrompt,
          dispatchAppInstalled,
        } =
          createPort()

        const service =
          new AppInstallationService(
            port,
          )

        service.initialize()

        dispatchBeforeInstallPrompt(
          createPromptEvent(
            'accepted',
          ).event,
        )

        dispatchAppInstalled()

        expect(
          service.getSnapshot(),
        ).toEqual({
          canInstall: false,
          isInstalled: true,
        })
      },
    )

    it(
      'retorna indisponível quando não existe prompt capturado',
      async () => {
        const {
          port,
        } =
          createPort()

        const service =
          new AppInstallationService(
            port,
          )

        service.initialize()

        await expect(
          service
            .requestInstallation(),
        ).resolves.toBe(
          AppInstallationResult
            .UNAVAILABLE,
        )
      },
    )

    it(
      'notifica assinantes somente quando o estado muda',
      () => {
        const {
          port,
          dispatchBeforeInstallPrompt,
        } =
          createPort()

        const service =
          new AppInstallationService(
            port,
          )

        const listener =
          vi.fn()

        service.subscribe(
          listener,
        )

        service.initialize()

        dispatchBeforeInstallPrompt(
          createPromptEvent(
            'accepted',
          ).event,
        )

        expect(
          listener,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )
  },
)

import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  AppUpdateService,
  type AppUpdateBrowserPort,
  type AppUpdateRegistrationPort,
  type AppUpdateWorkerPort,
} from '@/services/offline/AppUpdateService'

function flushPromises():
  Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

class FakeWorker
  implements AppUpdateWorkerPort
{
  state = 'installing'

  readonly postMessage =
    vi.fn()

  private readonly listeners =
    new Set<() => void>()

  addStateChangeListener(
    listener: () => void,
  ): void {
    this.listeners.add(listener)
  }

  removeStateChangeListener(
    listener: () => void,
  ): void {
    this.listeners.delete(listener)
  }

  setState(
    state: string,
  ): void {
    this.state = state

    for (
      const listener
      of this.listeners
    ) {
      listener()
    }
  }
}

class FakeRegistration
  implements AppUpdateRegistrationPort
{
  waiting:
    AppUpdateWorkerPort | null =
      null

  installing:
    AppUpdateWorkerPort | null =
      null

  readonly update =
    vi.fn().mockResolvedValue(
      undefined,
    )

  private readonly listeners =
    new Set<() => void>()

  addUpdateFoundListener(
    listener: () => void,
  ): void {
    this.listeners.add(listener)
  }

  removeUpdateFoundListener(
    listener: () => void,
  ): void {
    this.listeners.delete(listener)
  }

  emitUpdateFound(): void {
    for (
      const listener
      of this.listeners
    ) {
      listener()
    }
  }
}

class FakeBrowserPort
  implements AppUpdateBrowserPort
{
  controller:
    object | null = {}

  readonly reload = vi.fn()

  private readonly listeners =
    new Set<() => void>()

  constructor(
    readonly registration:
      FakeRegistration,
  ) {}

  async getReadyRegistration():
    Promise<AppUpdateRegistrationPort> {
    return this.registration
  }

  addControllerChangeListener(
    listener: () => void,
  ): void {
    this.listeners.add(listener)
  }

  removeControllerChangeListener(
    listener: () => void,
  ): void {
    this.listeners.delete(listener)
  }

  emitControllerChange(): void {
    for (
      const listener
      of this.listeners
    ) {
      listener()
    }
  }
}

describe(
  'AppUpdateService',
  () => {
    it(
      'permanece indisponível sem suporte do navegador',
      () => {
        const service =
          new AppUpdateService(
            null,
          )

        service.initialize()

        expect(
          service.getSnapshot(),
        ).toEqual({
          isUpdateAvailable:
            false,
          isApplying: false,
        })
      },
    )

    it(
      'detecta worker já aguardando ativação',
      async () => {
        const registration =
          new FakeRegistration()

        registration.waiting =
          new FakeWorker()

        const port =
          new FakeBrowserPort(
            registration,
          )

        const service =
          new AppUpdateService(
            port,
          )

        service.initialize()

        await flushPromises()

        expect(
          service.getSnapshot()
            .isUpdateAvailable,
        ).toBe(true)

        expect(
          registration.update,
        ).toHaveBeenCalledOnce()
      },
    )

    it(
      'detecta atualização quando o novo worker termina de instalar',
      async () => {
        const registration =
          new FakeRegistration()

        const worker =
          new FakeWorker()

        registration.installing =
          worker

        const service =
          new AppUpdateService(
            new FakeBrowserPort(
              registration,
            ),
          )

        service.initialize()

        await flushPromises()

        registration
          .emitUpdateFound()

        worker.setState(
          'installed',
        )

        expect(
          service.getSnapshot()
            .isUpdateAvailable,
        ).toBe(true)
      },
    )

    it(
      'envia SKIP_WAITING ao aplicar atualização',
      async () => {
        const registration =
          new FakeRegistration()

        const worker =
          new FakeWorker()

        registration.waiting =
          worker

        const service =
          new AppUpdateService(
            new FakeBrowserPort(
              registration,
            ),
          )

        service.initialize()

        await flushPromises()

        await service.applyUpdate()

        expect(
          worker.postMessage,
        ).toHaveBeenCalledWith({
          type: 'SKIP_WAITING',
        })

        expect(
          service.getSnapshot()
            .isApplying,
        ).toBe(true)
      },
    )

    it(
      'recarrega somente depois de aplicar uma atualização',
      async () => {
        const registration =
          new FakeRegistration()

        const worker =
          new FakeWorker()

        registration.waiting =
          worker

        const port =
          new FakeBrowserPort(
            registration,
          )

        const service =
          new AppUpdateService(
            port,
          )

        service.initialize()

        await flushPromises()

        port.emitControllerChange()

        expect(
          port.reload,
        ).not.toHaveBeenCalled()

        await service.applyUpdate()

        port.emitControllerChange()

        expect(
          port.reload,
        ).toHaveBeenCalledOnce()
      },
    )
  },
)

export interface AppUpdateWorkerPort {
  readonly state: string

  postMessage(
    message: unknown,
  ): void

  addStateChangeListener(
    listener: () => void,
  ): void

  removeStateChangeListener(
    listener: () => void,
  ): void
}

export interface AppUpdateRegistrationPort {
  readonly waiting:
    AppUpdateWorkerPort | null

  readonly installing:
    AppUpdateWorkerPort | null

  update(): Promise<void>

  addUpdateFoundListener(
    listener: () => void,
  ): void

  removeUpdateFoundListener(
    listener: () => void,
  ): void
}

export interface AppUpdateBrowserPort {
  readonly controller:
    object | null

  getReadyRegistration():
    Promise<AppUpdateRegistrationPort>

  addControllerChangeListener(
    listener: () => void,
  ): void

  removeControllerChangeListener(
    listener: () => void,
  ): void

  reload(): void
}

export interface AppUpdateSnapshot {
  readonly isUpdateAvailable: boolean
  readonly isApplying: boolean
}

const INITIAL_SNAPSHOT:
  AppUpdateSnapshot = {
    isUpdateAvailable: false,
    isApplying: false,
  }

export class AppUpdateService {
  private readonly listeners =
    new Set<() => void>()

  private snapshot:
    AppUpdateSnapshot =
      INITIAL_SNAPSHOT

  private registration:
    AppUpdateRegistrationPort | null =
      null

  private candidateWorker:
    AppUpdateWorkerPort | null =
      null

  private initialized = false

  constructor(
    private readonly port:
      AppUpdateBrowserPort | null,
  ) {}

  readonly getSnapshot = ():
    AppUpdateSnapshot =>
      this.snapshot

  readonly subscribe = (
    listener: () => void,
  ): (() => void) => {
    this.listeners.add(
      listener,
    )

    return () => {
      this.listeners.delete(
        listener,
      )
    }
  }

  initialize(): void {
    if (
      this.initialized ||
      this.port === null
    ) {
      return
    }

    this.initialized = true

    this.port
      .addControllerChangeListener(
        this.handleControllerChange,
      )

    void this.startWatching()
  }

  dispose(): void {
    if (
      !this.initialized ||
      this.port === null
    ) {
      return
    }

    this.registration
      ?.removeUpdateFoundListener(
        this.handleUpdateFound,
      )

    this.candidateWorker
      ?.removeStateChangeListener(
        this.handleCandidateStateChange,
      )

    this.port
      .removeControllerChangeListener(
        this.handleControllerChange,
      )

    this.initialized = false
    this.registration = null
    this.candidateWorker = null
    this.updateSnapshot(
      false,
      false,
    )
  }

  dismiss(): void {
    if (
      !this.snapshot
        .isUpdateAvailable
    ) {
      return
    }

    this.updateSnapshot(
      false,
      false,
    )
  }

  async applyUpdate():
    Promise<void> {
    if (
      this.port === null ||
      this.snapshot.isApplying
    ) {
      return
    }

    const worker =
      this.registration?.waiting ??
      this.candidateWorker

    if (worker === null) {
      return
    }

    this.updateSnapshot(
      true,
      true,
    )

    worker.postMessage({
      type: 'SKIP_WAITING',
    })
  }

  private async startWatching():
    Promise<void> {
    if (
      this.port === null
    ) {
      return
    }

    try {
      const registration =
        await this.port
          .getReadyRegistration()

      if (!this.initialized) {
        return
      }

      this.registration =
        registration

      registration
        .addUpdateFoundListener(
          this.handleUpdateFound,
        )

      if (
        registration.waiting !==
        null
      ) {
        this.setCandidateWorker(
          registration.waiting,
        )

        this.updateSnapshot(
          true,
          false,
        )
      }

      await registration.update()
    } catch {
      // Atualização é complementar.
      // Falhas de verificação não podem
      // impedir o leitor de funcionar.
    }
  }

  private readonly handleUpdateFound =
    (): void => {
      const worker =
        this.registration
          ?.installing

      if (
        worker === null ||
        worker === undefined
      ) {
        return
      }

      this.setCandidateWorker(
        worker,
      )

      this.handleCandidateStateChange()
    }

  private readonly handleCandidateStateChange =
    (): void => {
      if (
        this.port === null ||
        this.candidateWorker ===
          null
      ) {
        return
      }

      if (
        this.candidateWorker
          .state !== 'installed'
      ) {
        return
      }

      if (
        this.port.controller ===
        null
      ) {
        return
      }

      this.updateSnapshot(
        true,
        false,
      )
    }

  private readonly handleControllerChange =
    (): void => {
      if (
        this.port === null ||
        !this.snapshot.isApplying
      ) {
        return
      }

      this.port.reload()
    }

  private setCandidateWorker(
    worker:
      AppUpdateWorkerPort,
  ): void {
    if (
      this.candidateWorker ===
      worker
    ) {
      return
    }

    this.candidateWorker
      ?.removeStateChangeListener(
        this.handleCandidateStateChange,
      )

    this.candidateWorker =
      worker

    worker.addStateChangeListener(
      this.handleCandidateStateChange,
    )
  }

  private updateSnapshot(
    isUpdateAvailable: boolean,
    isApplying: boolean,
  ): void {
    if (
      this.snapshot
        .isUpdateAvailable ===
        isUpdateAvailable &&
      this.snapshot.isApplying ===
        isApplying
    ) {
      return
    }

    this.snapshot = {
      isUpdateAvailable,
      isApplying,
    }

    for (
      const listener
      of this.listeners
    ) {
      listener()
    }
  }
}

function adaptWorker(
  worker: ServiceWorker,
): AppUpdateWorkerPort {
  return {
    get state() {
      return worker.state
    },

    postMessage: (message) => {
      worker.postMessage(message)
    },

    addStateChangeListener:
      (listener) => {
        worker.addEventListener(
          'statechange',
          listener,
        )
      },

    removeStateChangeListener:
      (listener) => {
        worker.removeEventListener(
          'statechange',
          listener,
        )
      },
  }
}

function adaptRegistration(
  registration:
    ServiceWorkerRegistration,
): AppUpdateRegistrationPort {
  const workerMap =
    new WeakMap<
      ServiceWorker,
      AppUpdateWorkerPort
    >()

  const getWorker = (
    worker: ServiceWorker | null,
  ): AppUpdateWorkerPort | null => {
    if (worker === null) {
      return null
    }

    const existingWorker =
      workerMap.get(worker)

    if (
      existingWorker !== undefined
    ) {
      return existingWorker
    }

    const adaptedWorker =
      adaptWorker(worker)

    workerMap.set(
      worker,
      adaptedWorker,
    )

    return adaptedWorker
  }

  return {
    get waiting() {
      return getWorker(
        registration.waiting,
      )
    },

    get installing() {
      return getWorker(
        registration.installing,
      )
    },

    update: () =>
      registration.update().then(
        () => undefined,
      ),

    addUpdateFoundListener:
      (listener) => {
        registration.addEventListener(
          'updatefound',
          listener,
        )
      },

    removeUpdateFoundListener:
      (listener) => {
        registration
          .removeEventListener(
            'updatefound',
            listener,
          )
      },
  }
}

function createBrowserPort():
  AppUpdateBrowserPort | null {
  if (
    typeof window ===
      'undefined' ||
    !(
      'serviceWorker' in
      navigator
    )
  ) {
    return null
  }

  const container =
    navigator.serviceWorker

  return {
    get controller() {
      return container.controller
    },

    getReadyRegistration:
      async () =>
        adaptRegistration(
          await container.ready,
        ),

    addControllerChangeListener:
      (listener) => {
        container.addEventListener(
          'controllerchange',
          listener,
        )
      },

    removeControllerChangeListener:
      (listener) => {
        container.removeEventListener(
          'controllerchange',
          listener,
        )
      },

    reload: () => {
      window.location.reload()
    },
  }
}

export const appUpdateService =
  new AppUpdateService(
    createBrowserPort(),
  )

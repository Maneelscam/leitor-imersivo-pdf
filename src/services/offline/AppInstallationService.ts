export const AppInstallationResult = {
  ACCEPTED: 'accepted',
  DISMISSED: 'dismissed',
  UNAVAILABLE: 'unavailable',
  ERROR: 'error',
} as const

export type AppInstallationResult =
  (typeof AppInstallationResult)[keyof typeof AppInstallationResult]

export interface AppInstallationChoice {
  readonly outcome:
    | 'accepted'
    | 'dismissed'
}

export interface AppInstallationPromptEvent {
  preventDefault(): void

  prompt(): Promise<void>

  readonly userChoice:
    Promise<AppInstallationChoice>
}

export interface AppInstallationPort {
  isStandalone(): boolean

  addBeforeInstallPromptListener(
    listener: (
      event:
        AppInstallationPromptEvent,
    ) => void,
  ): void

  removeBeforeInstallPromptListener(
    listener: (
      event:
        AppInstallationPromptEvent,
    ) => void,
  ): void

  addAppInstalledListener(
    listener: () => void,
  ): void

  removeAppInstalledListener(
    listener: () => void,
  ): void
}

export interface AppInstallationSnapshot {
  readonly canInstall: boolean
  readonly isInstalled: boolean
}

const INITIAL_SNAPSHOT:
  AppInstallationSnapshot = {
    canInstall: false,
    isInstalled: false,
  }

export class AppInstallationService {
  private readonly listeners =
    new Set<() => void>()

  private promptEvent:
    AppInstallationPromptEvent | null =
    null

  private snapshot:
    AppInstallationSnapshot =
    INITIAL_SNAPSHOT

  private initialized = false

  constructor(
    private readonly port:
      AppInstallationPort | null,
  ) {}

  readonly getSnapshot = ():
    AppInstallationSnapshot =>
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

    if (
      this.port.isStandalone()
    ) {
      this.updateSnapshot(
        false,
        true,
      )

      return
    }

    this.port
      .addBeforeInstallPromptListener(
        this.handleBeforeInstallPrompt,
      )

    this.port
      .addAppInstalledListener(
        this.handleAppInstalled,
      )
  }

  dispose(): void {
    if (
      !this.initialized ||
      this.port === null
    ) {
      return
    }

    this.port
      .removeBeforeInstallPromptListener(
        this.handleBeforeInstallPrompt,
      )

    this.port
      .removeAppInstalledListener(
        this.handleAppInstalled,
      )

    this.initialized = false
    this.promptEvent = null

    this.updateSnapshot(
      false,
      this.port.isStandalone(),
    )
  }

  async requestInstallation():
    Promise<AppInstallationResult> {
    const promptEvent =
      this.promptEvent

    if (
      promptEvent === null ||
      this.snapshot.isInstalled
    ) {
      return AppInstallationResult
        .UNAVAILABLE
    }

    this.promptEvent = null

    try {
      await promptEvent.prompt()

      const choice =
        await promptEvent.userChoice

      if (
        choice.outcome ===
        'accepted'
      ) {
        this.updateSnapshot(
          false,
          true,
        )

        return AppInstallationResult
          .ACCEPTED
      }

      this.updateSnapshot(
        false,
        false,
      )

      return AppInstallationResult
        .DISMISSED
    } catch {
      this.updateSnapshot(
        false,
        false,
      )

      return AppInstallationResult
        .ERROR
    }
  }

  private readonly handleBeforeInstallPrompt = (
    event:
      AppInstallationPromptEvent,
  ): void => {
    event.preventDefault()

    if (
      this.snapshot.isInstalled
    ) {
      return
    }

    this.promptEvent =
      event

    this.updateSnapshot(
      true,
      false,
    )
  }

  private readonly handleAppInstalled = (): void => {
    this.promptEvent = null

    this.updateSnapshot(
      false,
      true,
    )
  }

  private updateSnapshot(
    canInstall: boolean,
    isInstalled: boolean,
  ): void {
    if (
      this.snapshot.canInstall ===
        canInstall &&
      this.snapshot.isInstalled ===
        isInstalled
    ) {
      return
    }

    this.snapshot = {
      canInstall,
      isInstalled,
    }

    for (
      const listener
      of this.listeners
    ) {
      listener()
    }
  }
}

function createBrowserPort():
  AppInstallationPort | null {
  if (
    typeof window ===
    'undefined'
  ) {
    return null
  }

  const standaloneNavigator =
    window.navigator as
      Navigator & {
        readonly standalone?:
          boolean
      }

  return {
    isStandalone: () =>
      window
        .matchMedia(
          '(display-mode: standalone)',
        )
        .matches ||
      standaloneNavigator
        .standalone === true,

    addBeforeInstallPromptListener:
      (listener) => {
        window.addEventListener(
          'beforeinstallprompt',
          listener as
            unknown as
            EventListener,
        )
      },

    removeBeforeInstallPromptListener:
      (listener) => {
        window.removeEventListener(
          'beforeinstallprompt',
          listener as
            unknown as
            EventListener,
        )
      },

    addAppInstalledListener:
      (listener) => {
        window.addEventListener(
          'appinstalled',
          listener,
        )
      },

    removeAppInstalledListener:
      (listener) => {
        window.removeEventListener(
          'appinstalled',
          listener,
        )
      },
  }
}

export const appInstallationService =
  new AppInstallationService(
    createBrowserPort(),
  )

export interface ServiceWorkerRegistrationPort {
  register(
    scriptUrl: string,
    options: {
      readonly scope: string
    },
  ): Promise<unknown>
}

export interface OfflineServiceWorkerOptions {
  readonly enabled: boolean

  readonly baseUrl: string

  readonly serviceWorker:
    ServiceWorkerRegistrationPort | null
}

function normalizeBaseUrl(
  baseUrl: string,
): string {
  const normalizedBaseUrl =
    baseUrl.trim()

  if (
    normalizedBaseUrl.length ===
    0
  ) {
    return '/'
  }

  return normalizedBaseUrl.endsWith(
    '/',
  )
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/`
}

export class OfflineServiceWorkerService {
  constructor(
    private readonly options:
      OfflineServiceWorkerOptions,
  ) {}

  async register(): Promise<void> {
    if (
      !this.options.enabled ||
      this.options.serviceWorker ===
        null
    ) {
      return
    }

    const baseUrl =
      normalizeBaseUrl(
        this.options.baseUrl,
      )

    try {
      await this.options
        .serviceWorker
        .register(
          `${baseUrl}sw.js`,
          {
            scope:
              baseUrl,
          },
        )
    } catch {
      // O modo offline é complementar.
      // Uma falha de registro nunca pode
      // impedir o leitor de iniciar.
    }
  }
}

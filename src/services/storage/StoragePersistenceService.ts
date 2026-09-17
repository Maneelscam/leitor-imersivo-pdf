export const StoragePersistenceStatus = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
} as const

export type StoragePersistenceStatus =
  (typeof StoragePersistenceStatus)[keyof typeof StoragePersistenceStatus]

export const StoragePersistenceRequestResult = {
  GRANTED: 'granted',
  DENIED: 'denied',
  ALREADY_PERSISTENT: 'already-persistent',
  UNSUPPORTED: 'unsupported',
  ERROR: 'error',
} as const

export type StoragePersistenceRequestResult =
  (typeof StoragePersistenceRequestResult)[keyof typeof StoragePersistenceRequestResult]

export interface StorageEstimate {
  readonly usage: number | undefined
  readonly quota: number | undefined
}

export interface StoragePersistencePort {
  persisted(): Promise<boolean>
  persist(): Promise<boolean>
  estimate(): Promise<StorageEstimate>
}

export interface StoragePersistenceSnapshot {
  readonly status: StoragePersistenceStatus
  readonly isSupported: boolean
  readonly isPersistent: boolean
  readonly usageBytes: number | null
  readonly quotaBytes: number | null
}

const INITIAL_SNAPSHOT: StoragePersistenceSnapshot = {
  status: StoragePersistenceStatus.IDLE,
  isSupported: false,
  isPersistent: false,
  usageBytes: null,
  quotaBytes: null,
}

function normalizeByteValue(
  value: number | undefined,
): number | null {
  if (
    value === undefined ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return null
  }

  return value
}

export class StoragePersistenceService {
  private readonly listeners =
    new Set<() => void>()

  private snapshot:
    StoragePersistenceSnapshot =
    INITIAL_SNAPSHOT

  private initialized = false
  private refreshPromise:
    Promise<void> | null =
    null

  constructor(
    private readonly port:
      StoragePersistencePort | null,
  ) {}

  readonly getSnapshot = ():
    StoragePersistenceSnapshot =>
      this.snapshot

  readonly subscribe = (
    listener: () => void,
  ): (() => void) => {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  initialize(): void {
    if (this.initialized) {
      return
    }

    this.initialized = true

    if (this.port === null) {
      this.updateSnapshot({
        status: StoragePersistenceStatus.READY,
        isSupported: false,
        isPersistent: false,
        usageBytes: null,
        quotaBytes: null,
      })

      return
    }

    void this.refresh()
  }

  async refresh(): Promise<void> {
    if (this.port === null) {
      this.updateSnapshot({
        status: StoragePersistenceStatus.READY,
        isSupported: false,
        isPersistent: false,
        usageBytes: null,
        quotaBytes: null,
      })

      return
    }

    if (this.refreshPromise !== null) {
      return this.refreshPromise
    }

    this.updateSnapshot({
      ...this.snapshot,
      status: StoragePersistenceStatus.LOADING,
      isSupported: true,
    })

    this.refreshPromise = this.loadSnapshot()

    try {
      await this.refreshPromise
    } finally {
      this.refreshPromise = null
    }
  }

  async requestPersistence():
    Promise<StoragePersistenceRequestResult> {
    if (this.port === null) {
      return StoragePersistenceRequestResult.UNSUPPORTED
    }

    if (this.snapshot.isPersistent) {
      return StoragePersistenceRequestResult.ALREADY_PERSISTENT
    }

    this.updateSnapshot({
      ...this.snapshot,
      status: StoragePersistenceStatus.LOADING,
      isSupported: true,
    })

    try {
      const granted = await this.port.persist()

      await this.loadSnapshot()

      return granted
        ? StoragePersistenceRequestResult.GRANTED
        : StoragePersistenceRequestResult.DENIED
    } catch {
      this.updateSnapshot({
        ...this.snapshot,
        status: StoragePersistenceStatus.ERROR,
        isSupported: true,
      })

      return StoragePersistenceRequestResult.ERROR
    }
  }

  private async loadSnapshot():
    Promise<void> {
    if (this.port === null) {
      return
    }

    try {
      const [
        isPersistent,
        estimate,
      ] = await Promise.all([
        this.port.persisted(),
        this.port.estimate(),
      ])

      this.updateSnapshot({
        status: StoragePersistenceStatus.READY,
        isSupported: true,
        isPersistent,
        usageBytes:
          normalizeByteValue(
            estimate.usage,
          ),
        quotaBytes:
          normalizeByteValue(
            estimate.quota,
          ),
      })
    } catch {
      this.updateSnapshot({
        ...this.snapshot,
        status: StoragePersistenceStatus.ERROR,
        isSupported: true,
      })
    }
  }

  private updateSnapshot(
    nextSnapshot:
      StoragePersistenceSnapshot,
  ): void {
    const current = this.snapshot

    if (
      current.status ===
        nextSnapshot.status &&
      current.isSupported ===
        nextSnapshot.isSupported &&
      current.isPersistent ===
        nextSnapshot.isPersistent &&
      current.usageBytes ===
        nextSnapshot.usageBytes &&
      current.quotaBytes ===
        nextSnapshot.quotaBytes
    ) {
      return
    }

    this.snapshot = nextSnapshot

    for (const listener of this.listeners) {
      listener()
    }
  }
}

function createBrowserPort():
  StoragePersistencePort | null {
  if (
    typeof navigator === 'undefined' ||
    navigator.storage === undefined ||
    typeof navigator.storage.persisted !== 'function' ||
    typeof navigator.storage.persist !== 'function' ||
    typeof navigator.storage.estimate !== 'function'
  ) {
    return null
  }

  return {
    persisted: () =>
      navigator.storage.persisted(),

    persist: () =>
      navigator.storage.persist(),

    estimate: async () => {
      const estimate =
        await navigator.storage.estimate()

      return {
        usage: estimate.usage,
        quota: estimate.quota,
      }
    },
  }
}

export const storagePersistenceService =
  new StoragePersistenceService(
    createBrowserPort(),
  )

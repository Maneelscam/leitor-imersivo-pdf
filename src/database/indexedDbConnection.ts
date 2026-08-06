import {
  APP_CONFIG,
} from '@/app/config/app.config'
import {
  runDatabaseMigrations,
} from '@/database/migrations/runDatabaseMigrations'

let databaseInstance:
  IDBDatabase | null = null

let databaseOpeningPromise:
  Promise<IDBDatabase> | null = null

function ensureIndexedDbIsAvailable(): void {
  if (
    !('indexedDB' in globalThis)
  ) {
    throw new Error(
      'O IndexedDB não está disponível neste navegador.',
    )
  }
}

function configureDatabaseLifecycle(
  database: IDBDatabase,
): void {
  database.onversionchange = () => {
    database.close()

    if (
      databaseInstance === database
    ) {
      databaseInstance = null
    }
  }

  database.onclose = () => {
    if (
      databaseInstance === database
    ) {
      databaseInstance = null
    }
  }
}

function createDatabaseOpeningPromise():
  Promise<IDBDatabase> {
  return new Promise<IDBDatabase>(
    (resolve, reject) => {
      const request =
        indexedDB.open(
          APP_CONFIG.database.name,
          APP_CONFIG.database.version,
        )

      let migrationError:
        unknown = null

      let wasRejectedBecauseBlocked =
        false

      request.onupgradeneeded = (
        event,
      ) => {
        try {
          runDatabaseMigrations(
            request.result,
            event.oldVersion,
            event.newVersion,
          )
        } catch (error) {
          migrationError = error

          request.transaction?.abort()
        }
      }

      request.onsuccess = () => {
        const database =
          request.result

        if (
          wasRejectedBecauseBlocked
        ) {
          database.close()

          return
        }

        configureDatabaseLifecycle(
          database,
        )

        databaseInstance =
          database

        resolve(database)
      }

      request.onerror = () => {
        reject(
          migrationError ??
            request.error ??
            new Error(
              'Não foi possível abrir o banco de dados local.',
            ),
        )
      }

      request.onblocked = () => {
        wasRejectedBecauseBlocked =
          true

        reject(
          new Error(
            'A atualização do banco foi bloqueada por outra aba aberta do aplicativo.',
          ),
        )
      }
    },
  )
}

export async function getIndexedDbConnection():
  Promise<IDBDatabase> {
  ensureIndexedDbIsAvailable()

  if (
    databaseInstance !== null
  ) {
    return databaseInstance
  }

  if (
    databaseOpeningPromise !== null
  ) {
    return databaseOpeningPromise
  }

  const openingPromise =
    createDatabaseOpeningPromise()

  databaseOpeningPromise =
    openingPromise

  try {
    return await openingPromise
  } finally {
    if (
      databaseOpeningPromise ===
      openingPromise
    ) {
      databaseOpeningPromise = null
    }
  }
}

export function closeIndexedDbConnection():
  void {
  databaseInstance?.close()

  databaseInstance = null
}
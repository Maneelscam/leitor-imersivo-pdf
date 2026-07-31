import {
  READER_SETTINGS_RECORD_KEY,
} from '@/database/schemas/databaseSchema'
import { getIndexedDbConnection } from '@/database/indexedDbConnection'
import {
  requestToPromise,
  transactionToPromise,
} from '@/database/indexedDbPromises'
import { DATABASE_STORE_NAMES } from '@/database/stores/databaseStoreNames'
import type { ReaderSettings } from '@/models/entities/ReaderSettings'
import type { ReaderSettingsRepository } from '@/repositories/contracts/ReaderSettingsRepository'

export class IndexedDbReaderSettingsRepository
  implements ReaderSettingsRepository
{
  async save(settings: ReaderSettings): Promise<void> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.READER_SETTINGS,
      'readwrite',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(
      DATABASE_STORE_NAMES.READER_SETTINGS,
    )

    store.put(settings, READER_SETTINGS_RECORD_KEY)

    await transactionCompleted
  }

  async find(): Promise<ReaderSettings | null> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.READER_SETTINGS,
      'readonly',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(
      DATABASE_STORE_NAMES.READER_SETTINGS,
    )

    const settings = await requestToPromise(
      store.get(
        READER_SETTINGS_RECORD_KEY,
      ) as IDBRequest<ReaderSettings | undefined>,
    )

    await transactionCompleted

    return settings ?? null
  }

  async delete(): Promise<void> {
    const database = await getIndexedDbConnection()
    const transaction = database.transaction(
      DATABASE_STORE_NAMES.READER_SETTINGS,
      'readwrite',
    )
    const transactionCompleted = transactionToPromise(transaction)
    const store = transaction.objectStore(
      DATABASE_STORE_NAMES.READER_SETTINGS,
    )

    store.delete(READER_SETTINGS_RECORD_KEY)

    await transactionCompleted
  }
}
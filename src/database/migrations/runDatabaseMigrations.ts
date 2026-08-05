import {
  createDatabaseSchemaV1,
} from '@/database/migrations/createDatabaseSchemaV1'
import {
  createDatabaseSchemaV2,
} from '@/database/migrations/createDatabaseSchemaV2'
import {
  createDatabaseSchemaV3,
} from '@/database/migrations/createDatabaseSchemaV3'

export function runDatabaseMigrations(
  database: IDBDatabase,
  oldVersion: number,
  newVersion: number | null,
): void {
  if (newVersion === null) {
    throw new Error(
      'Não foi possível identificar a nova versão do banco de dados.',
    )
  }

  if (oldVersion > newVersion) {
    throw new Error(
      'A versão instalada do banco é superior à versão suportada pelo aplicativo.',
    )
  }

  if (
    oldVersion < 1 &&
    newVersion >= 1
  ) {
    createDatabaseSchemaV1(
      database,
    )
  }

  if (
    oldVersion < 2 &&
    newVersion >= 2
  ) {
    createDatabaseSchemaV2(
      database,
    )
  }

  if (
    oldVersion < 3 &&
    newVersion >= 3
  ) {
    createDatabaseSchemaV3(
      database,
    )
  }
}
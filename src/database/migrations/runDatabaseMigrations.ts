import { createDatabaseSchemaV1 } from '@/database/migrations/createDatabaseSchemaV1'

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

  if (oldVersion < 1 && newVersion >= 1) {
    createDatabaseSchemaV1(database)
  }
}
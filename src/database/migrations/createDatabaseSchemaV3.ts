import {
  createDatabaseSchemaV2,
} from '@/database/migrations/createDatabaseSchemaV2'

export function createDatabaseSchemaV3(
  database: IDBDatabase,
): void {
  createDatabaseSchemaV2(database)
}
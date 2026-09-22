import {
  DATABASE_INDEX_NAMES,
} from '@/database/stores/databaseIndexNames'
import {
  DATABASE_STORE_NAMES,
} from '@/database/stores/databaseStoreNames'
import {
  getIndexedDbConnection,
} from '@/database/indexedDbConnection'
import {
  requestToPromise,
  transactionToPromise,
} from '@/database/indexedDbPromises'
import type {
  CollectionMembership,
} from '@/models/entities/CollectionMembership'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  CollectionId,
} from '@/models/value-objects/CollectionId'
import type {
  CollectionMembershipRepository,
} from '@/repositories/contracts/CollectionMembershipRepository'

function createMembershipKey(
  collectionId: CollectionId,
  bookId: BookId,
): [CollectionId, BookId] {
  return [
    collectionId,
    bookId,
  ]
}

export class IndexedDbCollectionMembershipRepository
implements CollectionMembershipRepository {
  async save(
    membership: CollectionMembership,
  ): Promise<void> {
    const database =
      await getIndexedDbConnection()

    const transaction =
      database.transaction(
        DATABASE_STORE_NAMES
          .COLLECTION_MEMBERSHIPS,
        'readwrite',
      )

    const completed =
      transactionToPromise(
        transaction,
      )

    transaction
      .objectStore(
        DATABASE_STORE_NAMES
          .COLLECTION_MEMBERSHIPS,
      )
      .put(membership)

    await completed
  }

  async exists(
    collectionId: CollectionId,
    bookId: BookId,
  ): Promise<boolean> {
    const database =
      await getIndexedDbConnection()

    const transaction =
      database.transaction(
        DATABASE_STORE_NAMES
          .COLLECTION_MEMBERSHIPS,
        'readonly',
      )

    const completed =
      transactionToPromise(
        transaction,
      )

    const membership =
      await requestToPromise(
        transaction
          .objectStore(
            DATABASE_STORE_NAMES
              .COLLECTION_MEMBERSHIPS,
          )
          .get(
            createMembershipKey(
              collectionId,
              bookId,
            ),
          ) as IDBRequest<
            CollectionMembership | undefined
          >,
      )

    await completed

    return membership !== undefined
  }

  async findByCollectionId(
    collectionId: CollectionId,
  ): Promise<
    readonly CollectionMembership[]
  > {
    return this.findAllByIndex(
      DATABASE_INDEX_NAMES
        .COLLECTION_MEMBERSHIPS
        .BY_COLLECTION_ID,
      collectionId,
    )
  }

  async findByBookId(
    bookId: BookId,
  ): Promise<
    readonly CollectionMembership[]
  > {
    return this.findAllByIndex(
      DATABASE_INDEX_NAMES
        .COLLECTION_MEMBERSHIPS
        .BY_BOOK_ID,
      bookId,
    )
  }

  async delete(
    collectionId: CollectionId,
    bookId: BookId,
  ): Promise<void> {
    const database =
      await getIndexedDbConnection()

    const transaction =
      database.transaction(
        DATABASE_STORE_NAMES
          .COLLECTION_MEMBERSHIPS,
        'readwrite',
      )

    const completed =
      transactionToPromise(
        transaction,
      )

    transaction
      .objectStore(
        DATABASE_STORE_NAMES
          .COLLECTION_MEMBERSHIPS,
      )
      .delete(
        createMembershipKey(
          collectionId,
          bookId,
        ),
      )

    await completed
  }

  async deleteByCollectionId(
    collectionId: CollectionId,
  ): Promise<void> {
    await this.deleteAllByIndex(
      DATABASE_INDEX_NAMES
        .COLLECTION_MEMBERSHIPS
        .BY_COLLECTION_ID,
      collectionId,
    )
  }

  async deleteByBookId(
    bookId: BookId,
  ): Promise<void> {
    await this.deleteAllByIndex(
      DATABASE_INDEX_NAMES
        .COLLECTION_MEMBERSHIPS
        .BY_BOOK_ID,
      bookId,
    )
  }

  private async findAllByIndex(
    indexName: string,
    key: IDBValidKey,
  ): Promise<
    readonly CollectionMembership[]
  > {
    const database =
      await getIndexedDbConnection()

    const transaction =
      database.transaction(
        DATABASE_STORE_NAMES
          .COLLECTION_MEMBERSHIPS,
        'readonly',
      )

    const completed =
      transactionToPromise(
        transaction,
      )

    const memberships =
      await requestToPromise(
        transaction
          .objectStore(
            DATABASE_STORE_NAMES
              .COLLECTION_MEMBERSHIPS,
          )
          .index(indexName)
          .getAll(
            key,
          ) as IDBRequest<
            CollectionMembership[]
          >,
      )

    await completed

    return memberships
  }

  private async deleteAllByIndex(
    indexName: string,
    key: IDBValidKey,
  ): Promise<void> {
    const database =
      await getIndexedDbConnection()

    const transaction =
      database.transaction(
        DATABASE_STORE_NAMES
          .COLLECTION_MEMBERSHIPS,
        'readwrite',
      )

    const completed =
      transactionToPromise(
        transaction,
      )

    const store =
      transaction.objectStore(
        DATABASE_STORE_NAMES
          .COLLECTION_MEMBERSHIPS,
      )

    const keys =
      await requestToPromise(
        store
          .index(indexName)
          .getAllKeys(
            key,
          ),
      )

    for (
      const membershipKey
      of keys
    ) {
      store.delete(
        membershipKey,
      )
    }

    await completed
  }
}

import {
  getIndexedDbConnection,
} from '@/database/indexedDbConnection'
import {
  requestToPromise,
  transactionToPromise,
} from '@/database/indexedDbPromises'
import {
  DATABASE_INDEX_NAMES,
} from '@/database/stores/databaseIndexNames'
import {
  DATABASE_STORE_NAMES,
} from '@/database/stores/databaseStoreNames'
import type {
  Annotation,
} from '@/models/entities/Annotation'
import type {
  AnnotationId,
} from '@/models/value-objects/AnnotationId'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  AnnotationRepository,
} from '@/repositories/contracts/AnnotationRepository'

export class IndexedDbAnnotationRepository
  implements AnnotationRepository
{
  async save(
    annotation: Annotation,
  ): Promise<void> {
    const database =
      await getIndexedDbConnection()

    const transaction =
      database.transaction(
        DATABASE_STORE_NAMES.ANNOTATIONS,
        'readwrite',
      )

    const transactionCompleted =
      transactionToPromise(
        transaction,
      )

    const store =
      transaction.objectStore(
        DATABASE_STORE_NAMES.ANNOTATIONS,
      )

    store.put(
      annotation,
    )

    await transactionCompleted
  }

  async findById(
    annotationId: AnnotationId,
  ): Promise<Annotation | null> {
    const database =
      await getIndexedDbConnection()

    const transaction =
      database.transaction(
        DATABASE_STORE_NAMES.ANNOTATIONS,
        'readonly',
      )

    const transactionCompleted =
      transactionToPromise(
        transaction,
      )

    const store =
      transaction.objectStore(
        DATABASE_STORE_NAMES.ANNOTATIONS,
      )

    const annotation =
      await requestToPromise(
        store.get(
          annotationId,
        ) as IDBRequest<
          Annotation | undefined
        >,
      )

    await transactionCompleted

    return annotation ?? null
  }

  async findByBookId(
    bookId: BookId,
  ): Promise<readonly Annotation[]> {
    const database =
      await getIndexedDbConnection()

    const transaction =
      database.transaction(
        DATABASE_STORE_NAMES.ANNOTATIONS,
        'readonly',
      )

    const transactionCompleted =
      transactionToPromise(
        transaction,
      )

    const store =
      transaction.objectStore(
        DATABASE_STORE_NAMES.ANNOTATIONS,
      )

    const index =
      store.index(
        DATABASE_INDEX_NAMES.ANNOTATIONS
          .BY_BOOK_ID,
      )

    const annotations =
      await requestToPromise(
        index.getAll(
          bookId,
        ) as IDBRequest<Annotation[]>,
      )

    await transactionCompleted

    return annotations
  }

  async findByBookAndPage(
    bookId: BookId,
    pageNumber: number,
  ): Promise<readonly Annotation[]> {
    const database =
      await getIndexedDbConnection()

    const transaction =
      database.transaction(
        DATABASE_STORE_NAMES.ANNOTATIONS,
        'readonly',
      )

    const transactionCompleted =
      transactionToPromise(
        transaction,
      )

    const store =
      transaction.objectStore(
        DATABASE_STORE_NAMES.ANNOTATIONS,
      )

    const index =
      store.index(
        DATABASE_INDEX_NAMES.ANNOTATIONS
          .BY_BOOK_AND_PAGE,
      )

    const annotations =
      await requestToPromise(
        index.getAll([
          bookId,
          pageNumber,
        ]) as IDBRequest<Annotation[]>,
      )

    await transactionCompleted

    return annotations
  }

  async deleteById(
    annotationId: AnnotationId,
  ): Promise<void> {
    const database =
      await getIndexedDbConnection()

    const transaction =
      database.transaction(
        DATABASE_STORE_NAMES.ANNOTATIONS,
        'readwrite',
      )

    const transactionCompleted =
      transactionToPromise(
        transaction,
      )

    const store =
      transaction.objectStore(
        DATABASE_STORE_NAMES.ANNOTATIONS,
      )

    store.delete(
      annotationId,
    )

    await transactionCompleted
  }

  async deleteByBookId(
    bookId: BookId,
  ): Promise<void> {
    const database =
      await getIndexedDbConnection()

    const transaction =
      database.transaction(
        DATABASE_STORE_NAMES.ANNOTATIONS,
        'readwrite',
      )

    const transactionCompleted =
      transactionToPromise(
        transaction,
      )

    const store =
      transaction.objectStore(
        DATABASE_STORE_NAMES.ANNOTATIONS,
      )

    const index =
      store.index(
        DATABASE_INDEX_NAMES.ANNOTATIONS
          .BY_BOOK_ID,
      )

    const cursorRequest =
      index.openKeyCursor(
        IDBKeyRange.only(
          bookId,
        ),
      )

    cursorRequest.addEventListener(
      'success',
      () => {
        const cursor =
          cursorRequest.result

        if (cursor === null) {
          return
        }

        store.delete(
          cursor.primaryKey,
        )

        cursor.continue()
      },
    )

    await transactionCompleted
  }
}
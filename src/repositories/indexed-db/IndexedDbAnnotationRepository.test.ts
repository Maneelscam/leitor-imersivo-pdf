import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'

import {
  APP_CONFIG,
} from '@/app/config/app.config'
import {
  closeIndexedDbConnection,
} from '@/database/indexedDbConnection'
import type {
  NoteAnnotation,
} from '@/models/entities/Annotation'
import {
  AnnotationType,
} from '@/models/enums/AnnotationType'
import type {
  AnnotationId,
} from '@/models/value-objects/AnnotationId'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  IsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import {
  IndexedDbAnnotationRepository,
} from '@/repositories/indexed-db/IndexedDbAnnotationRepository'

const FIRST_BOOK_ID =
  'livro-anotacoes-1' as BookId

const SECOND_BOOK_ID =
  'livro-anotacoes-2' as BookId

const FIRST_ANNOTATION_ID =
  'anotacao-1' as AnnotationId

const SECOND_ANNOTATION_ID =
  'anotacao-2' as AnnotationId

const THIRD_ANNOTATION_ID =
  'anotacao-3' as AnnotationId

const FOURTH_ANNOTATION_ID =
  'anotacao-4' as AnnotationId

const TEST_DATE =
  '2026-08-07T11:00:00.000Z' as IsoDateTime

const UPDATED_DATE =
  '2026-08-07T12:00:00.000Z' as IsoDateTime

function deleteTestDatabase():
  Promise<void> {
  closeIndexedDbConnection()

  return new Promise<void>(
    (resolve, reject) => {
      const request =
        indexedDB.deleteDatabase(
          APP_CONFIG.database.name,
        )

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(
          request.error ??
            new Error(
              'Não foi possível excluir o banco de teste.',
            ),
        )
      }

      request.onblocked = () => {
        reject(
          new Error(
            'A exclusão do banco de teste foi bloqueada.',
          ),
        )
      }
    },
  )
}

function createNoteAnnotation({
  id,
  bookId,
  pageNumber,
  content,
}: {
  readonly id: AnnotationId
  readonly bookId: BookId
  readonly pageNumber: number
  readonly content: string
}): NoteAnnotation {
  return {
    id,
    bookId,

    pageNumber,
    pageOffsetRatio: 0.25,

    type:
      AnnotationType.NOTE,

    content,

    createdAt:
      TEST_DATE,

    updatedAt:
      TEST_DATE,
  }
}

describe(
  'IndexedDbAnnotationRepository',
  () => {
    beforeEach(
      async () => {
        await deleteTestDatabase()
      },
    )

    afterEach(
      async () => {
        await deleteTestDatabase()
      },
    )

    it(
      'salva e recupera uma anotação pelo identificador',
      async () => {
        const repository =
          new IndexedDbAnnotationRepository()

        const annotation =
          createNoteAnnotation({
            id:
              FIRST_ANNOTATION_ID,

            bookId:
              FIRST_BOOK_ID,

            pageNumber: 3,

            content:
              'Primeira anotação de teste.',
          })

        await repository.save(
          annotation,
        )

        const restoredAnnotation =
          await repository.findById(
            FIRST_ANNOTATION_ID,
          )

        expect(
          restoredAnnotation,
        ).toEqual(
          annotation,
        )
      },
    )

    it(
      'atualiza uma anotação existente ao salvar o mesmo identificador',
      async () => {
        const repository =
          new IndexedDbAnnotationRepository()

        const originalAnnotation =
          createNoteAnnotation({
            id:
              FIRST_ANNOTATION_ID,

            bookId:
              FIRST_BOOK_ID,

            pageNumber: 4,

            content:
              'Conteúdo original.',
          })

        await repository.save(
          originalAnnotation,
        )

        const updatedAnnotation:
          NoteAnnotation = {
            ...originalAnnotation,

            content:
              'Conteúdo atualizado.',

            updatedAt:
              UPDATED_DATE,
          }

        await repository.save(
          updatedAnnotation,
        )

        const restoredAnnotation =
          await repository.findById(
            FIRST_ANNOTATION_ID,
          )

        expect(
          restoredAnnotation,
        ).toEqual(
          updatedAnnotation,
        )
      },
    )

    it(
      'lista somente as anotações do livro solicitado',
      async () => {
        const repository =
          new IndexedDbAnnotationRepository()

        await repository.save(
          createNoteAnnotation({
            id:
              FIRST_ANNOTATION_ID,

            bookId:
              FIRST_BOOK_ID,

            pageNumber: 2,

            content:
              'Anotação do primeiro livro.',
          }),
        )

        await repository.save(
          createNoteAnnotation({
            id:
              SECOND_ANNOTATION_ID,

            bookId:
              FIRST_BOOK_ID,

            pageNumber: 5,

            content:
              'Outra anotação do primeiro livro.',
          }),
        )

        await repository.save(
          createNoteAnnotation({
            id:
              THIRD_ANNOTATION_ID,

            bookId:
              SECOND_BOOK_ID,

            pageNumber: 2,

            content:
              'Anotação do segundo livro.',
          }),
        )

        const annotations =
          await repository.findByBookId(
            FIRST_BOOK_ID,
          )

        expect(
          annotations
            .map(
              (annotation) =>
                annotation.id,
            )
            .sort(),
        ).toEqual(
          [
            FIRST_ANNOTATION_ID,
            SECOND_ANNOTATION_ID,
          ].sort(),
        )
      },
    )

    it(
      'lista somente as anotações da página solicitada',
      async () => {
        const repository =
          new IndexedDbAnnotationRepository()

        await repository.save(
          createNoteAnnotation({
            id:
              FIRST_ANNOTATION_ID,

            bookId:
              FIRST_BOOK_ID,

            pageNumber: 7,

            content:
              'Primeira anotação da página 7.',
          }),
        )

        await repository.save(
          createNoteAnnotation({
            id:
              SECOND_ANNOTATION_ID,

            bookId:
              FIRST_BOOK_ID,

            pageNumber: 7,

            content:
              'Segunda anotação da página 7.',
          }),
        )

        await repository.save(
          createNoteAnnotation({
            id:
              THIRD_ANNOTATION_ID,

            bookId:
              FIRST_BOOK_ID,

            pageNumber: 8,

            content:
              'Anotação da página 8.',
          }),
        )

        await repository.save(
          createNoteAnnotation({
            id:
              FOURTH_ANNOTATION_ID,

            bookId:
              SECOND_BOOK_ID,

            pageNumber: 7,

            content:
              'Página 7 de outro livro.',
          }),
        )

        const annotations =
          await repository
            .findByBookAndPage(
              FIRST_BOOK_ID,
              7,
            )

        expect(
          annotations
            .map(
              (annotation) =>
                annotation.id,
            )
            .sort(),
        ).toEqual(
          [
            FIRST_ANNOTATION_ID,
            SECOND_ANNOTATION_ID,
          ].sort(),
        )
      },
    )

    it(
      'exclui uma anotação pelo identificador',
      async () => {
        const repository =
          new IndexedDbAnnotationRepository()

        const annotation =
          createNoteAnnotation({
            id:
              FIRST_ANNOTATION_ID,

            bookId:
              FIRST_BOOK_ID,

            pageNumber: 3,

            content:
              'Anotação que será excluída.',
          })

        await repository.save(
          annotation,
        )

        await repository.deleteById(
          FIRST_ANNOTATION_ID,
        )

        const restoredAnnotation =
          await repository.findById(
            FIRST_ANNOTATION_ID,
          )

        expect(
          restoredAnnotation,
        ).toBeNull()
      },
    )

    it(
      'exclui todas as anotações de um livro sem afetar outro livro',
      async () => {
        const repository =
          new IndexedDbAnnotationRepository()

        await repository.save(
          createNoteAnnotation({
            id:
              FIRST_ANNOTATION_ID,

            bookId:
              FIRST_BOOK_ID,

            pageNumber: 2,

            content:
              'Primeira anotação que será excluída.',
          }),
        )

        await repository.save(
          createNoteAnnotation({
            id:
              SECOND_ANNOTATION_ID,

            bookId:
              FIRST_BOOK_ID,

            pageNumber: 6,

            content:
              'Segunda anotação que será excluída.',
          }),
        )

        const preservedAnnotation =
          createNoteAnnotation({
            id:
              THIRD_ANNOTATION_ID,

            bookId:
              SECOND_BOOK_ID,

            pageNumber: 4,

            content:
              'Anotação que deve permanecer.',
          })

        await repository.save(
          preservedAnnotation,
        )

        await repository.deleteByBookId(
          FIRST_BOOK_ID,
        )

        const deletedBookAnnotations =
          await repository.findByBookId(
            FIRST_BOOK_ID,
          )

        const preservedBookAnnotations =
          await repository.findByBookId(
            SECOND_BOOK_ID,
          )

        expect(
          deletedBookAnnotations,
        ).toEqual([])

        expect(
          preservedBookAnnotations,
        ).toEqual([
          preservedAnnotation,
        ])
      },
    )
  },
)
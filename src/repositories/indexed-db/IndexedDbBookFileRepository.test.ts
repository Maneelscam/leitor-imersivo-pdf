import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'

import { APP_CONFIG } from '@/app/config/app.config'
import { closeIndexedDbConnection } from '@/database/indexedDbConnection'
import type { BookFile } from '@/models/entities/BookFile'
import type { BookId } from '@/models/value-objects/BookId'
import type { IsoDateTime } from '@/models/value-objects/IsoDateTime'
import { IndexedDbBookFileRepository } from '@/repositories/indexed-db/IndexedDbBookFileRepository'

const FIRST_BOOK_ID = 'livro-arquivo-1' as BookId
const SECOND_BOOK_ID = 'livro-arquivo-2' as BookId
const FIRST_DATE = '2026-08-11T13:00:00.000Z' as IsoDateTime
const UPDATED_DATE = '2026-08-11T13:30:00.000Z' as IsoDateTime

function deleteTestDatabase(): Promise<void> {
  closeIndexedDbConnection()

  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(APP_CONFIG.database.name)

    request.onsuccess = () => resolve()
    request.onerror = () =>
      reject(
        request.error ??
          new Error('Não foi possível excluir o banco de teste.'),
      )
    request.onblocked = () =>
      reject(new Error('A exclusão do banco de teste foi bloqueada.'))
  })
}

function createBookFile(
  bookId: BookId,
  content: string,
  storedAt: IsoDateTime = FIRST_DATE,
): BookFile {
  return {
    bookId,
    file: new Blob([content], { type: 'application/pdf' }),
    storedAt,
  }
}

async function expectBlobToMatch(
  actual: Blob,
  expected: Blob,
): Promise<void> {
  expect(actual.type).toBe(expected.type)
  expect(actual.size).toBe(expected.size)
  expect(await actual.text()).toBe(await expected.text())
}

describe('IndexedDbBookFileRepository', () => {
  beforeEach(async () => {
    await deleteTestDatabase()
  })

  afterEach(async () => {
    await deleteTestDatabase()
  })

  it('salva e recupera o arquivo PDF de um livro', async () => {
    const repository = new IndexedDbBookFileRepository()
    const bookFile = createBookFile(
      FIRST_BOOK_ID,
      '%PDF-1.7 arquivo de teste',
    )

    await repository.save(bookFile)

    const restored = await repository.findByBookId(FIRST_BOOK_ID)

    expect(restored).not.toBeNull()
    expect(restored?.bookId).toBe(FIRST_BOOK_ID)
    expect(restored?.storedAt).toBe(FIRST_DATE)
    await expectBlobToMatch(restored!.file, bookFile.file)
  })

  it('retorna null quando o livro não possui arquivo salvo', async () => {
    const repository = new IndexedDbBookFileRepository()

    expect(
      await repository.findByBookId(FIRST_BOOK_ID),
    ).toBeNull()
  })

  it('substitui o arquivo existente ao salvar novamente o mesmo livro', async () => {
    const repository = new IndexedDbBookFileRepository()

    await repository.save(
      createBookFile(FIRST_BOOK_ID, '%PDF conteúdo original'),
    )

    const updated = createBookFile(
      FIRST_BOOK_ID,
      '%PDF conteúdo atualizado',
      UPDATED_DATE,
    )

    await repository.save(updated)

    const restored = await repository.findByBookId(FIRST_BOOK_ID)

    expect(restored?.storedAt).toBe(UPDATED_DATE)
    await expectBlobToMatch(restored!.file, updated.file)
  })

  it('mantém arquivos independentes para livros diferentes', async () => {
    const repository = new IndexedDbBookFileRepository()
    const first = createBookFile(
      FIRST_BOOK_ID,
      '%PDF primeiro livro',
    )
    const second = createBookFile(
      SECOND_BOOK_ID,
      '%PDF segundo livro',
      UPDATED_DATE,
    )

    await repository.save(first)
    await repository.save(second)

    const firstResult = await repository.findByBookId(FIRST_BOOK_ID)
    const secondResult = await repository.findByBookId(SECOND_BOOK_ID)

    expect(firstResult?.bookId).toBe(FIRST_BOOK_ID)
    expect(secondResult?.bookId).toBe(SECOND_BOOK_ID)
    await expectBlobToMatch(firstResult!.file, first.file)
    await expectBlobToMatch(secondResult!.file, second.file)
  })

  it('exclui somente o arquivo do livro solicitado', async () => {
    const repository = new IndexedDbBookFileRepository()
    const deleted = createBookFile(
      FIRST_BOOK_ID,
      '%PDF arquivo excluído',
    )
    const preserved = createBookFile(
      SECOND_BOOK_ID,
      '%PDF arquivo preservado',
    )

    await repository.save(deleted)
    await repository.save(preserved)
    await repository.deleteByBookId(FIRST_BOOK_ID)

    expect(
      await repository.findByBookId(FIRST_BOOK_ID),
    ).toBeNull()

    const preservedResult =
      await repository.findByBookId(SECOND_BOOK_ID)

    expect(preservedResult).not.toBeNull()
    await expectBlobToMatch(preservedResult!.file, preserved.file)
  })
})
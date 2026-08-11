import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'

import { APP_CONFIG } from '@/app/config/app.config'
import { closeIndexedDbConnection } from '@/database/indexedDbConnection'
import type { BookCover } from '@/models/entities/BookCover'
import type { BookId } from '@/models/value-objects/BookId'
import type { IsoDateTime } from '@/models/value-objects/IsoDateTime'
import { IndexedDbBookCoverRepository } from '@/repositories/indexed-db/IndexedDbBookCoverRepository'

const FIRST_BOOK_ID = 'livro-capa-1' as BookId
const SECOND_BOOK_ID = 'livro-capa-2' as BookId
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

function createBookCover(
  bookId: BookId,
  content: string,
  width: number,
  height: number,
  generatedAt: IsoDateTime = FIRST_DATE,
): BookCover {
  return {
    bookId,
    image: new Blob([content], { type: 'image/webp' }),
    mimeType: 'image/webp',
    width,
    height,
    generatedAt,
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

describe('IndexedDbBookCoverRepository', () => {
  beforeEach(async () => {
    await deleteTestDatabase()
  })

  afterEach(async () => {
    await deleteTestDatabase()
  })

  it('salva e recupera a capa de um livro', async () => {
    const repository = new IndexedDbBookCoverRepository()
    const cover = createBookCover(
      FIRST_BOOK_ID,
      'imagem-webp-da-capa',
      800,
      1200,
    )

    await repository.save(cover)

    const restored = await repository.findByBookId(FIRST_BOOK_ID)

    expect(restored).not.toBeNull()
    expect(restored?.bookId).toBe(FIRST_BOOK_ID)
    expect(restored?.mimeType).toBe('image/webp')
    expect(restored?.width).toBe(800)
    expect(restored?.height).toBe(1200)
    expect(restored?.generatedAt).toBe(FIRST_DATE)
    await expectBlobToMatch(restored!.image, cover.image)
  })

  it('retorna null quando o livro não possui capa salva', async () => {
    const repository = new IndexedDbBookCoverRepository()

    expect(
      await repository.findByBookId(FIRST_BOOK_ID),
    ).toBeNull()
  })

  it('substitui a capa existente ao salvar novamente o mesmo livro', async () => {
    const repository = new IndexedDbBookCoverRepository()

    await repository.save(
      createBookCover(
        FIRST_BOOK_ID,
        'capa-original',
        600,
        900,
      ),
    )

    const updated = createBookCover(
      FIRST_BOOK_ID,
      'capa-atualizada',
      900,
      1350,
      UPDATED_DATE,
    )

    await repository.save(updated)

    const restored = await repository.findByBookId(FIRST_BOOK_ID)

    expect(restored?.width).toBe(900)
    expect(restored?.height).toBe(1350)
    expect(restored?.generatedAt).toBe(UPDATED_DATE)
    await expectBlobToMatch(restored!.image, updated.image)
  })

  it('mantém capas independentes para livros diferentes', async () => {
    const repository = new IndexedDbBookCoverRepository()
    const first = createBookCover(
      FIRST_BOOK_ID,
      'capa-primeiro-livro',
      600,
      900,
    )
    const second = createBookCover(
      SECOND_BOOK_ID,
      'capa-segundo-livro',
      800,
      1200,
      UPDATED_DATE,
    )

    await repository.save(first)
    await repository.save(second)

    const firstResult = await repository.findByBookId(FIRST_BOOK_ID)
    const secondResult = await repository.findByBookId(SECOND_BOOK_ID)

    expect(firstResult?.bookId).toBe(FIRST_BOOK_ID)
    expect(secondResult?.bookId).toBe(SECOND_BOOK_ID)
    await expectBlobToMatch(firstResult!.image, first.image)
    await expectBlobToMatch(secondResult!.image, second.image)
  })

  it('exclui somente a capa do livro solicitado', async () => {
    const repository = new IndexedDbBookCoverRepository()
    const deleted = createBookCover(
      FIRST_BOOK_ID,
      'capa-excluída',
      600,
      900,
    )
    const preserved = createBookCover(
      SECOND_BOOK_ID,
      'capa-preservada',
      800,
      1200,
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
    await expectBlobToMatch(preservedResult!.image, preserved.image)
  })
})
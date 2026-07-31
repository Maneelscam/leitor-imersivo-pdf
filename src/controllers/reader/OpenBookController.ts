import type { OpenBookResult } from '@/models/dtos/OpenBookResult'
import type { Book } from '@/models/entities/Book'
import type { BookFile } from '@/models/entities/BookFile'
import type { ReadingProgress } from '@/models/entities/ReadingProgress'
import type { BookId } from '@/models/value-objects/BookId'
import { createIsoDateTime } from '@/models/value-objects/IsoDateTime'
import type { BookFileRepository } from '@/repositories/contracts/BookFileRepository'
import type { BookRepository } from '@/repositories/contracts/BookRepository'
import type { ReadingProgressRepository } from '@/repositories/contracts/ReadingProgressRepository'
import {
  LibraryError,
  LibraryErrorCode,
} from '@/utils/errors/LibraryError'

export interface OpenBookCommand {
  readonly bookId: BookId
}

export interface OpenBookControllerDependencies {
  readonly bookRepository: BookRepository
  readonly bookFileRepository: BookFileRepository
  readonly readingProgressRepository: ReadingProgressRepository
}

export class OpenBookController {
  constructor(
    private readonly dependencies:
      OpenBookControllerDependencies,
  ) {}

  async execute(
    command: OpenBookCommand,
  ): Promise<OpenBookResult> {
    const {
      bookRepository,
      bookFileRepository,
      readingProgressRepository,
    } = this.dependencies

    let book: Book | null

    try {
      book = await bookRepository.findById(command.bookId)
    } catch (error) {
      throw new LibraryError(
        LibraryErrorCode.OPEN_FAILED,
        'Não foi possível consultar o livro selecionado.',
        {
          cause: error,
        },
      )
    }

    if (book === null) {
      throw new LibraryError(
        LibraryErrorCode.BOOK_NOT_FOUND,
        'O livro selecionado não foi encontrado na biblioteca.',
      )
    }

    let bookFile: BookFile | null
    let readingProgress: ReadingProgress | null

    try {
      ;[bookFile, readingProgress] = await Promise.all([
        bookFileRepository.findByBookId(command.bookId),
        readingProgressRepository.findByBookId(command.bookId),
      ])
    } catch (error) {
      throw new LibraryError(
        LibraryErrorCode.OPEN_FAILED,
        'Não foi possível preparar os dados do livro para leitura.',
        {
          cause: error,
        },
      )
    }

    if (bookFile === null) {
      throw new LibraryError(
        LibraryErrorCode.BOOK_FILE_NOT_FOUND,
        'O arquivo PDF original deste livro não foi encontrado.',
      )
    }

    const openedAt = createIsoDateTime()

    const updatedBook: Book = {
      ...book,
      updatedAt: openedAt,
      lastOpenedAt: openedAt,
    }

    try {
      await bookRepository.save(updatedBook)
    } catch (error) {
      throw new LibraryError(
        LibraryErrorCode.UPDATE_FAILED,
        'Não foi possível registrar o último acesso ao livro.',
        {
          cause: error,
        },
      )
    }

    return {
      book: updatedBook,
      bookFile,
      readingProgress,
    }
  }
}
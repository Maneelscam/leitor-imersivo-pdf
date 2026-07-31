import type { Book } from '@/models/entities/Book'
import type { BookId } from '@/models/value-objects/BookId'
import type { BookRepository } from '@/repositories/contracts/BookRepository'
import type { LibraryTransactionRepository } from '@/repositories/contracts/LibraryTransactionRepository'
import {
  LibraryError,
  LibraryErrorCode,
} from '@/utils/errors/LibraryError'

export interface DeleteBookCommand {
  readonly bookId: BookId
}

export interface DeleteBookControllerDependencies {
  readonly bookRepository: BookRepository
  readonly libraryTransactionRepository: LibraryTransactionRepository
}

export class DeleteBookController {
  constructor(
    private readonly dependencies:
      DeleteBookControllerDependencies,
  ) {}

  async execute(command: DeleteBookCommand): Promise<Book> {
    const {
      bookRepository,
      libraryTransactionRepository,
    } = this.dependencies

    let book: Book | null

    try {
      book = await bookRepository.findById(command.bookId)
    } catch (error) {
      throw new LibraryError(
        LibraryErrorCode.DELETE_FAILED,
        'Não foi possível consultar o livro antes da exclusão.',
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

    try {
      await libraryTransactionRepository.deleteBookCompletely(
        command.bookId,
      )
    } catch (error) {
      throw new LibraryError(
        LibraryErrorCode.DELETE_FAILED,
        'Não foi possível excluir o livro da biblioteca.',
        {
          cause: error,
        },
      )
    }

    return book
  }
}
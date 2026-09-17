import type {
  Book,
} from '@/models/entities/Book'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import {
  createIsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import type {
  BookRepository,
} from '@/repositories/contracts/BookRepository'
import {
  LibraryError,
  LibraryErrorCode,
} from '@/utils/errors/LibraryError'

export interface UpdateBookMetadataCommand {
  readonly bookId: BookId
  readonly title: string
  readonly author: string | null
}

function normalizeMetadataText(
  value: string,
): string {
  return value
    .replace(/\s+/g, ' ')
    .trim()
}

export class UpdateBookMetadataController {
  constructor(
    private readonly bookRepository:
      BookRepository,
  ) {}

  async execute(
    command:
      UpdateBookMetadataCommand,
  ): Promise<Book> {
    const normalizedTitle =
      normalizeMetadataText(
        command.title,
      )

    if (normalizedTitle.length === 0) {
      throw new LibraryError(
        LibraryErrorCode.UPDATE_FAILED,
        'O título do livro não pode ficar vazio.',
      )
    }

    const normalizedAuthor =
      command.author === null
        ? null
        : normalizeMetadataText(
            command.author,
          )

    const author =
      normalizedAuthor === null ||
      normalizedAuthor.length === 0
        ? null
        : normalizedAuthor

    let existingBook: Book | null

    try {
      existingBook =
        await this.bookRepository.findById(
          command.bookId,
        )
    } catch (error) {
      throw new LibraryError(
        LibraryErrorCode.UPDATE_FAILED,
        'Não foi possível consultar o livro antes da atualização.',
        {
          cause: error,
        },
      )
    }

    if (existingBook === null) {
      throw new LibraryError(
        LibraryErrorCode.BOOK_NOT_FOUND,
        'O livro selecionado não foi encontrado na biblioteca.',
      )
    }

    if (
      existingBook.title ===
        normalizedTitle &&
      existingBook.author === author
    ) {
      return existingBook
    }

    const updatedBook: Book = {
      ...existingBook,
      title:
        normalizedTitle,
      author,
      updatedAt:
        createIsoDateTime(),
    }

    try {
      await this.bookRepository.save(
        updatedBook,
      )
    } catch (error) {
      throw new LibraryError(
        LibraryErrorCode.UPDATE_FAILED,
        'Não foi possível salvar as novas informações do livro.',
        {
          cause: error,
        },
      )
    }

    return updatedBook
  }
}

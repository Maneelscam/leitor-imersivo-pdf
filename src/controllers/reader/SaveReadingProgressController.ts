import type { BookRepository } from '@/repositories/contracts/BookRepository'
import type { ReadingProgressRepository } from '@/repositories/contracts/ReadingProgressRepository'
import type { ReadingProgress } from '@/models/entities/ReadingProgress'
import type { BookId } from '@/models/value-objects/BookId'
import { createIsoDateTime } from '@/models/value-objects/IsoDateTime'
import {
  ReaderError,
  ReaderErrorCode,
} from '@/utils/errors/ReaderError'

export interface SaveReadingProgressCommand {
  readonly bookId: BookId
  readonly currentPage: number
  readonly pageOffsetRatio: number
}

export interface SaveReadingProgressControllerDependencies {
  readonly bookRepository: BookRepository
  readonly readingProgressRepository: ReadingProgressRepository
}

function validateCurrentPage(
  currentPage: number,
  totalPages: number,
): void {
  if (
    !Number.isInteger(currentPage) ||
    currentPage < 1 ||
    currentPage > totalPages
  ) {
    throw new ReaderError(
      ReaderErrorCode.INVALID_PAGE_NUMBER,
      `A página deve estar entre 1 e ${totalPages}.`,
    )
  }
}

function validatePageOffsetRatio(
  pageOffsetRatio: number,
): void {
  if (
    !Number.isFinite(pageOffsetRatio) ||
    pageOffsetRatio < 0 ||
    pageOffsetRatio > 1
  ) {
    throw new ReaderError(
      ReaderErrorCode.INVALID_PAGE_OFFSET,
      'A posição dentro da página deve estar entre 0 e 1.',
    )
  }
}

export class SaveReadingProgressController {
  constructor(
    private readonly dependencies:
      SaveReadingProgressControllerDependencies,
  ) {}

  async execute(
    command: SaveReadingProgressCommand,
  ): Promise<ReadingProgress> {
    const {
      bookRepository,
      readingProgressRepository,
    } = this.dependencies

    let book

    try {
      book = await bookRepository.findById(command.bookId)
    } catch (error) {
      throw new ReaderError(
        ReaderErrorCode.SAVE_PROGRESS_FAILED,
        'Não foi possível consultar o livro antes de salvar o progresso.',
        {
          cause: error,
        },
      )
    }

    if (book === null) {
      throw new ReaderError(
        ReaderErrorCode.BOOK_NOT_OPEN,
        'Não foi possível salvar o progresso porque o livro não está disponível.',
      )
    }

    validateCurrentPage(
      command.currentPage,
      book.totalPages,
    )

    validatePageOffsetRatio(
      command.pageOffsetRatio,
    )

    const readingProgress: ReadingProgress = {
      bookId: command.bookId,
      currentPage: command.currentPage,
      pageOffsetRatio: command.pageOffsetRatio,
      updatedAt: createIsoDateTime(),
    }

    try {
      await readingProgressRepository.save(
        readingProgress,
      )
    } catch (error) {
      throw new ReaderError(
        ReaderErrorCode.SAVE_PROGRESS_FAILED,
        'Não foi possível salvar o progresso de leitura.',
        {
          cause: error,
        },
      )
    }

    return readingProgress
  }
}
import type {
  CollectionMembership,
} from '@/models/entities/CollectionMembership'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  CollectionId,
} from '@/models/value-objects/CollectionId'
import {
  createIsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import type {
  BookRepository,
} from '@/repositories/contracts/BookRepository'
import type {
  CollectionMembershipRepository,
} from '@/repositories/contracts/CollectionMembershipRepository'
import type {
  CollectionRepository,
} from '@/repositories/contracts/CollectionRepository'
import {
  CollectionError,
  CollectionErrorCode,
} from '@/utils/errors/CollectionError'

export interface AddBookToCollectionCommand {
  readonly collectionId:
    CollectionId

  readonly bookId:
    BookId
}

export interface AddBookToCollectionControllerDependencies {
  readonly collectionRepository:
    CollectionRepository

  readonly membershipRepository:
    CollectionMembershipRepository

  readonly bookRepository:
    BookRepository
}

export class AddBookToCollectionController {
  constructor(
    private readonly dependencies:
      AddBookToCollectionControllerDependencies,
  ) {}

  async execute(
    command: AddBookToCollectionCommand,
  ): Promise<CollectionMembership> {
    const {
      collectionRepository,
      membershipRepository,
      bookRepository,
    } = this.dependencies

    let collection
    let book

    try {
      ;[
        collection,
        book,
      ] = await Promise.all([
        collectionRepository.findById(
          command.collectionId,
        ),
        bookRepository.findById(
          command.bookId,
        ),
      ])
    } catch (error) {
      throw new CollectionError(
        CollectionErrorCode.LOAD_FAILED,
        'Não foi possível validar o vínculo entre livro e coleção.',
        {
          cause: error,
        },
      )
    }

    if (collection === null) {
      throw new CollectionError(
        CollectionErrorCode.NOT_FOUND,
        'A coleção selecionada não foi encontrada.',
      )
    }

    if (book === null) {
      throw new CollectionError(
        CollectionErrorCode.BOOK_NOT_FOUND,
        'O livro selecionado não foi encontrado.',
      )
    }

    try {
      const memberships =
        await membershipRepository
          .findByCollectionId(
            command.collectionId,
          )

      const existing =
        memberships.find(
          (membership) =>
            membership.bookId ===
            command.bookId,
        )

      if (existing !== undefined) {
        return existing
      }
    } catch (error) {
      throw new CollectionError(
        CollectionErrorCode.LOAD_FAILED,
        'Não foi possível verificar o vínculo do livro.',
        {
          cause: error,
        },
      )
    }

    const membership:
      CollectionMembership = {
        collectionId:
          command.collectionId,

        bookId:
          command.bookId,

        addedAt:
          createIsoDateTime(),
      }

    try {
      await membershipRepository.save(
        membership,
      )
    } catch (error) {
      throw new CollectionError(
        CollectionErrorCode.MEMBERSHIP_SAVE_FAILED,
        'Não foi possível adicionar o livro à coleção.',
        {
          cause: error,
        },
      )
    }

    return membership
  }
}

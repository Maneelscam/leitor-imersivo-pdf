import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  CollectionId,
} from '@/models/value-objects/CollectionId'
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

export interface RemoveBookFromCollectionCommand {
  readonly collectionId:
    CollectionId

  readonly bookId:
    BookId
}

export interface RemoveBookFromCollectionControllerDependencies {
  readonly collectionRepository:
    CollectionRepository

  readonly membershipRepository:
    CollectionMembershipRepository
}

export class RemoveBookFromCollectionController {
  constructor(
    private readonly dependencies:
      RemoveBookFromCollectionControllerDependencies,
  ) {}

  async execute(
    command: RemoveBookFromCollectionCommand,
  ): Promise<void> {
    const {
      collectionRepository,
      membershipRepository,
    } = this.dependencies

    try {
      const collection =
        await collectionRepository
          .findById(
            command.collectionId,
          )

      if (collection === null) {
        throw new CollectionError(
          CollectionErrorCode.NOT_FOUND,
          'A coleção selecionada não foi encontrada.',
        )
      }

      await membershipRepository.delete(
        command.collectionId,
        command.bookId,
      )
    } catch (error) {
      if (
        error instanceof
        CollectionError
      ) {
        throw error
      }

      throw new CollectionError(
        CollectionErrorCode.MEMBERSHIP_DELETE_FAILED,
        'Não foi possível remover o livro da coleção.',
        {
          cause: error,
        },
      )
    }
  }
}

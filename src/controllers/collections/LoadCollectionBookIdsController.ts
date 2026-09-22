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

export class LoadCollectionBookIdsController {
  constructor(
    private readonly collectionRepository:
      CollectionRepository,

    private readonly membershipRepository:
      CollectionMembershipRepository,
  ) {}

  async execute(
    collectionId: CollectionId,
  ): Promise<readonly BookId[]> {
    try {
      const collection =
        await this.collectionRepository
          .findById(
            collectionId,
          )

      if (collection === null) {
        throw new CollectionError(
          CollectionErrorCode.NOT_FOUND,
          'A coleção selecionada não foi encontrada.',
        )
      }

      const memberships =
        await this.membershipRepository
          .findByCollectionId(
            collectionId,
          )

      return memberships.map(
        (membership) =>
          membership.bookId,
      )
    } catch (error) {
      if (
        error instanceof
        CollectionError
      ) {
        throw error
      }

      throw new CollectionError(
        CollectionErrorCode.LOAD_FAILED,
        'Não foi possível carregar os livros da coleção.',
        {
          cause: error,
        },
      )
    }
  }
}

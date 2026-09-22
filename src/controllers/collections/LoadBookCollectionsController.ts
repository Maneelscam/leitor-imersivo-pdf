import type {
  Collection,
} from '@/models/entities/Collection'
import type {
  BookId,
} from '@/models/value-objects/BookId'
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

export class LoadBookCollectionsController {
  constructor(
    private readonly collectionRepository:
      CollectionRepository,

    private readonly membershipRepository:
      CollectionMembershipRepository,
  ) {}

  async execute(
    bookId: BookId,
  ): Promise<readonly Collection[]> {
    try {
      const memberships =
        await this.membershipRepository
          .findByBookId(
            bookId,
          )

      const collections =
        await Promise.all(
          memberships.map(
            (membership) =>
              this.collectionRepository
                .findById(
                  membership.collectionId,
                ),
          ),
        )

      return collections
        .filter(
          (
            collection,
          ): collection is Collection =>
            collection !== null,
        )
        .sort(
          (left, right) =>
            left.name.localeCompare(
              right.name,
              'pt-BR',
              {
                sensitivity:
                  'base',
              },
            ),
        )
    } catch (error) {
      throw new CollectionError(
        CollectionErrorCode.LOAD_FAILED,
        'Não foi possível carregar as coleções do livro.',
        {
          cause: error,
        },
      )
    }
  }
}

import type {
  CollectionSummary,
} from '@/models/dtos/CollectionSummary'
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

export interface LoadCollectionsControllerDependencies {
  readonly collectionRepository:
    CollectionRepository

  readonly membershipRepository:
    CollectionMembershipRepository
}

export class LoadCollectionsController {
  constructor(
    private readonly dependencies:
      LoadCollectionsControllerDependencies,
  ) {}

  async execute():
    Promise<readonly CollectionSummary[]> {
    const {
      collectionRepository,
      membershipRepository,
    } = this.dependencies

    try {
      const collections =
        await collectionRepository
          .findAll()

      const summaries =
        await Promise.all(
          collections.map(
            async (collection) => {
              const memberships =
                await membershipRepository
                  .findByCollectionId(
                    collection.id,
                  )

              return {
                collection,
                bookCount:
                  memberships.length,
              }
            },
          ),
        )

      return summaries.sort(
        (left, right) =>
          left.collection.name
            .localeCompare(
              right.collection.name,
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
        'Não foi possível carregar as coleções.',
        {
          cause: error,
        },
      )
    }
  }
}

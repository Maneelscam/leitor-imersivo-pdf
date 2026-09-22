import type {
  Collection,
} from '@/models/entities/Collection'
import type {
  CollectionId,
} from '@/models/value-objects/CollectionId'
import type {
  CollectionRepository,
} from '@/repositories/contracts/CollectionRepository'
import type {
  CollectionTransactionRepository,
} from '@/repositories/contracts/CollectionTransactionRepository'
import {
  CollectionError,
  CollectionErrorCode,
} from '@/utils/errors/CollectionError'

export interface DeleteCollectionCommand {
  readonly collectionId:
    CollectionId
}

export interface DeleteCollectionControllerDependencies {
  readonly collectionRepository:
    CollectionRepository

  readonly collectionTransactionRepository:
    CollectionTransactionRepository
}

export class DeleteCollectionController {
  constructor(
    private readonly dependencies:
      DeleteCollectionControllerDependencies,
  ) {}

  async execute(
    command: DeleteCollectionCommand,
  ): Promise<Collection> {
    const {
      collectionRepository,
      collectionTransactionRepository,
    } = this.dependencies

    let collection: Collection | null

    try {
      collection =
        await collectionRepository
          .findById(
            command.collectionId,
          )
    } catch (error) {
      throw new CollectionError(
        CollectionErrorCode.LOAD_FAILED,
        'Não foi possível consultar a coleção antes da exclusão.',
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

    try {
      await collectionTransactionRepository
        .deleteCollectionCompletely(
          command.collectionId,
        )
    } catch (error) {
      throw new CollectionError(
        CollectionErrorCode.DELETE_FAILED,
        'Não foi possível excluir a coleção.',
        {
          cause: error,
        },
      )
    }

    return collection
  }
}

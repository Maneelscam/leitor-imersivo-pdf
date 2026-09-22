import type {
  StateCreator,
} from 'zustand'

import {
  applicationContainer,
} from '@/app/providers/applicationContainer'
import {
  AsyncStatus,
} from '@/models/enums/AsyncStatus'
import type {
  AppStore,
  CollectionSlice,
} from '@/stores/appStore.types'
import {
  getErrorMessage,
} from '@/utils/errors/getErrorMessage'

type CollectionSliceCreator =
  StateCreator<
    AppStore,
    [],
    [],
    CollectionSlice
  >

async function loadCollectionSummaries() {
  return applicationContainer
    .controllers
    .loadCollections
    .execute()
}

export const createCollectionSlice:
  CollectionSliceCreator = (
    set,
  ) => ({
    collectionSummaries: [],

    collectionsLoadStatus:
      AsyncStatus.IDLE,

    collectionMutationStatus:
      AsyncStatus.IDLE,

    collectionErrorMessage: null,

    loadCollections: async () => {
      set({
        collectionsLoadStatus:
          AsyncStatus.LOADING,

        collectionErrorMessage:
          null,
      })

      try {
        const collectionSummaries =
          await loadCollectionSummaries()

        set({
          collectionSummaries,

          collectionsLoadStatus:
            AsyncStatus.SUCCESS,
        })
      } catch (error) {
        set({
          collectionsLoadStatus:
            AsyncStatus.ERROR,

          collectionErrorMessage:
            getErrorMessage(
              error,
              'Não foi possível carregar as coleções.',
            ),
        })
      }
    },

    createCollection: async (
      name,
      description,
    ) => {
      set({
        collectionMutationStatus:
          AsyncStatus.LOADING,

        collectionErrorMessage:
          null,
      })

      try {
        await applicationContainer
          .controllers
          .createCollection
          .execute({
            name,
            description,
          })

        const collectionSummaries =
          await loadCollectionSummaries()

        set({
          collectionSummaries,

          collectionMutationStatus:
            AsyncStatus.SUCCESS,
        })
      } catch (error) {
        set({
          collectionMutationStatus:
            AsyncStatus.ERROR,

          collectionErrorMessage:
            getErrorMessage(
              error,
              'Não foi possível criar a coleção.',
            ),
        })
      }
    },

    updateCollection: async (
      collectionId,
      name,
      description,
    ) => {
      set({
        collectionMutationStatus:
          AsyncStatus.LOADING,

        collectionErrorMessage:
          null,
      })

      try {
        await applicationContainer
          .controllers
          .updateCollection
          .execute({
            collectionId,
            name,
            description,
          })

        const collectionSummaries =
          await loadCollectionSummaries()

        set({
          collectionSummaries,

          collectionMutationStatus:
            AsyncStatus.SUCCESS,
        })
      } catch (error) {
        set({
          collectionMutationStatus:
            AsyncStatus.ERROR,

          collectionErrorMessage:
            getErrorMessage(
              error,
              'Não foi possível atualizar a coleção.',
            ),
        })
      }
    },

    deleteCollection: async (
      collectionId,
    ) => {
      set({
        collectionMutationStatus:
          AsyncStatus.LOADING,

        collectionErrorMessage:
          null,
      })

      try {
        await applicationContainer
          .controllers
          .deleteCollection
          .execute({
            collectionId,
          })

        const collectionSummaries =
          await loadCollectionSummaries()

        set({
          collectionSummaries,

          collectionMutationStatus:
            AsyncStatus.SUCCESS,
        })
      } catch (error) {
        set({
          collectionMutationStatus:
            AsyncStatus.ERROR,

          collectionErrorMessage:
            getErrorMessage(
              error,
              'Não foi possível excluir a coleção.',
            ),
        })
      }
    },

    addBookToCollection: async (
      collectionId,
      bookId,
    ) => {
      set({
        collectionMutationStatus:
          AsyncStatus.LOADING,

        collectionErrorMessage:
          null,
      })

      try {
        await applicationContainer
          .controllers
          .addBookToCollection
          .execute({
            collectionId,
            bookId,
          })

        const collectionSummaries =
          await loadCollectionSummaries()

        set({
          collectionSummaries,

          collectionMutationStatus:
            AsyncStatus.SUCCESS,
        })
      } catch (error) {
        set({
          collectionMutationStatus:
            AsyncStatus.ERROR,

          collectionErrorMessage:
            getErrorMessage(
              error,
              'Não foi possível adicionar o livro à coleção.',
            ),
        })
      }
    },

    removeBookFromCollection:
      async (
        collectionId,
        bookId,
      ) => {
        set({
          collectionMutationStatus:
            AsyncStatus.LOADING,

          collectionErrorMessage:
            null,
        })

        try {
          await applicationContainer
            .controllers
            .removeBookFromCollection
            .execute({
              collectionId,
              bookId,
            })

          const collectionSummaries =
            await loadCollectionSummaries()

          set({
            collectionSummaries,

            collectionMutationStatus:
              AsyncStatus.SUCCESS,
          })
        } catch (error) {
          set({
            collectionMutationStatus:
              AsyncStatus.ERROR,

            collectionErrorMessage:
              getErrorMessage(
                error,
                'Não foi possível remover o livro da coleção.',
              ),
          })
        }
      },

    loadBookCollections:
      async (bookId) => {
        set({
          collectionErrorMessage:
            null,
        })

        try {
          return await applicationContainer
            .controllers
            .loadBookCollections
            .execute(
              bookId,
            )
        } catch (error) {
          set({
            collectionErrorMessage:
              getErrorMessage(
                error,
                'Não foi possível carregar as coleções deste livro.',
              ),
          })

          return []
        }
      },

    loadCollectionBookIds:
      async (collectionId) => {
        set({
          collectionErrorMessage:
            null,
        })

        try {
          return await applicationContainer
            .controllers
            .loadCollectionBookIds
            .execute(
              collectionId,
            )
        } catch (error) {
          set({
            collectionErrorMessage:
              getErrorMessage(
                error,
                'Não foi possível carregar os livros da coleção.',
              ),
          })

          return []
        }
      },

    clearCollectionError: () => {
      set({
        collectionErrorMessage:
          null,
      })
    },
  })

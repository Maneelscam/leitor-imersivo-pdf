import type {
  AppStore,
} from '@/stores/appStore.types'

export const selectCollectionSummaries = (
  state: AppStore,
) => state.collectionSummaries

export const selectCollectionsLoadStatus = (
  state: AppStore,
) => state.collectionsLoadStatus

export const selectCollectionMutationStatus = (
  state: AppStore,
) => state.collectionMutationStatus

export const selectCollectionErrorMessage = (
  state: AppStore,
) => state.collectionErrorMessage

export const selectLoadCollections = (
  state: AppStore,
) => state.loadCollections

export const selectCreateCollection = (
  state: AppStore,
) => state.createCollection

export const selectUpdateCollection = (
  state: AppStore,
) => state.updateCollection

export const selectDeleteCollection = (
  state: AppStore,
) => state.deleteCollection

export const selectAddBookToCollection = (
  state: AppStore,
) => state.addBookToCollection

export const selectRemoveBookFromCollection = (
  state: AppStore,
) => state.removeBookFromCollection

export const selectLoadBookCollections = (
  state: AppStore,
) => state.loadBookCollections

export const selectLoadCollectionBookIds = (
  state: AppStore,
) => state.loadCollectionBookIds

export const selectClearCollectionError = (
  state: AppStore,
) => state.clearCollectionError

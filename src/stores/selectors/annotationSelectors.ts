import type {
  AppStore,
} from '@/stores/appStore.types'

export const selectAnnotations = (
  state: AppStore,
) => state.annotations

export const selectAnnotationsLoadStatus = (
  state: AppStore,
) => state.annotationsLoadStatus

export const selectAnnotationMutationStatus = (
  state: AppStore,
) => state.annotationMutationStatus

export const selectAnnotationErrorMessage = (
  state: AppStore,
) => state.annotationErrorMessage

export const selectLoadAnnotations = (
  state: AppStore,
) => state.loadAnnotations

export const selectCreateHighlightAnnotation = (
  state: AppStore,
) => state.createHighlightAnnotation

export const selectCreateNoteAnnotation = (
  state: AppStore,
) => state.createNoteAnnotation

export const selectDeleteAnnotation = (
  state: AppStore,
) => state.deleteAnnotation

export const selectClearAnnotationError = (
  state: AppStore,
) => state.clearAnnotationError
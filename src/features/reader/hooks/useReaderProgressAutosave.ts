import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'

import {
  hasReadingProgressChanged,
} from '@/features/reader/utils/hasReadingProgressChanged'
import {
  selectCurrentPage,
  selectOpenedBook,
  selectPageOffsetRatio,
} from '@/stores/selectors/readerSelectors'
import {
  useAppStore,
} from '@/stores/useAppStore'

const AUTOSAVE_DELAY_MS = 1200

export function useReaderProgressAutosave():
  void {
  const openedBook = useAppStore(
    selectOpenedBook,
  )

  const currentPage = useAppStore(
    selectCurrentPage,
  )

  const pageOffsetRatio = useAppStore(
    selectPageOffsetRatio,
  )

  const openedBookId =
    openedBook?.book.id ?? null

  const timeoutRef =
    useRef<number | null>(
      null,
    )

  const saveLoopRunningRef =
    useRef(false)

  const saveRequestedRef =
    useRef(false)

  const clearScheduledSave =
    useCallback(() => {
      if (
        timeoutRef.current === null
      ) {
        return
      }

      window.clearTimeout(
        timeoutRef.current,
      )

      timeoutRef.current = null
    }, [])

  const requestSave =
    useCallback(async () => {
      saveRequestedRef.current =
        true

      if (
        saveLoopRunningRef.current
      ) {
        return
      }

      saveLoopRunningRef.current =
        true

      try {
        while (
          saveRequestedRef.current
        ) {
          saveRequestedRef.current =
            false

          const state =
            useAppStore.getState()

          if (
            state.openedBook === null
          ) {
            continue
          }

          await state
            .saveReadingProgress()
        }
      } finally {
        saveLoopRunningRef.current =
          false
      }
    }, [])

  const hasUnsavedProgress =
    useMemo(
      () => {
        if (openedBook === null) {
          return false
        }

        return hasReadingProgressChanged(
          openedBook.readingProgress,
          currentPage,
          pageOffsetRatio,
        )
      },
      [
        openedBook,
        currentPage,
        pageOffsetRatio,
      ],
    )

  useEffect(() => {
    clearScheduledSave()

    if (
      openedBookId === null ||
      !hasUnsavedProgress
    ) {
      return
    }

    timeoutRef.current =
      window.setTimeout(
        () => {
          timeoutRef.current =
            null

          void requestSave()
        },
        AUTOSAVE_DELAY_MS,
      )

    return clearScheduledSave
  }, [
    openedBookId,
    currentPage,
    pageOffsetRatio,
    hasUnsavedProgress,
    clearScheduledSave,
    requestSave,
  ])

  useEffect(() => {
    if (openedBookId === null) {
      return
    }

    const flushPendingProgress =
      () => {
        const state =
          useAppStore.getState()

        if (
          state.openedBook === null ||
          !hasReadingProgressChanged(
            state.openedBook
              .readingProgress,
            state.currentPage,
            state.pageOffsetRatio,
          )
        ) {
          return
        }

        clearScheduledSave()

        void requestSave()
      }

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          'hidden'
        ) {
          flushPendingProgress()
        }
      }

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange,
    )

    window.addEventListener(
      'pagehide',
      flushPendingProgress,
    )

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      )

      window.removeEventListener(
        'pagehide',
        flushPendingProgress,
      )
    }
  }, [
    openedBookId,
    clearScheduledSave,
    requestSave,
  ])
}

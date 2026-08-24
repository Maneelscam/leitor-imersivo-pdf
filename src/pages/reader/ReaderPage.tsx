
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'


import {
  READER_SETTINGS_CONFIG,
} from '@/app/config/readerSettings.config'
import {
  AppRoute,
} from '@/app/routes/AppRoute'
import {
  navigateToAppRoute,
} from '@/app/routes/browserNavigation'
import {
  Button,
  ButtonVariant,
} from '@/components/buttons/Button'
import {
  EmptyState,
} from '@/components/feedback/EmptyState'
import {
  FeedbackMessage,
  FeedbackMessageVariant,
} from '@/components/feedback/FeedbackMessage'
import {
  useAppShell,
} from '@/components/layout/AppShellContext'
import {
  ReaderAnnotations,
} from '@/features/reader/components/ReaderAnnotations'
import {
  ReaderBookmarks,
} from '@/features/reader/components/ReaderBookmarks'
import {
  ReaderDocumentStage,
} from '@/features/reader/components/ReaderDocumentStage'
import {
  ReaderOutline,
} from '@/features/reader/components/ReaderOutline'
import {
  ReaderRotationControls,
} from '@/features/reader/components/ReaderRotationControls'
import {
  ReaderSidePanel,
} from '@/features/reader/components/ReaderSidePanel'
import {
  ReaderTextSearch,
} from '@/features/reader/components/ReaderTextSearch'
import {
  ReaderThumbnails,
} from '@/features/reader/components/ReaderThumbnails'
import {
  ReaderToolbar,
} from '@/features/reader/components/ReaderToolbar'
import {
  ReaderZoomControls,
} from '@/features/reader/components/ReaderZoomControls'
import {
  useReaderKeyboardShortcuts,
} from '@/features/reader/hooks/useReaderKeyboardShortcuts'
import type {
  PdfOutlineItem,
} from '@/models/dtos/PdfOutlineItem'
import type {
  PdfTextSearchOccurrence,
} from '@/models/dtos/PdfTextSearchResult'
import type {
  Annotation,
} from '@/models/entities/Annotation'
import type {
  Bookmark,
} from '@/models/entities/Bookmark'
import {
  AsyncStatus,
} from '@/models/enums/AsyncStatus'
import {
  PageDisplayMode,
} from '@/models/enums/PageDisplayMode'
import {
  ReadingFlowMode,
} from '@/models/enums/ReadingFlowMode'
import {
  ReaderPanelSection,
} from '@/models/enums/ReaderPanelSection'
import {
  ZoomMode,
} from '@/models/enums/ZoomMode'
import {
  selectAnnotationErrorMessage,
  selectAnnotationMutationStatus,
  selectAnnotations,
  selectAnnotationsLoadStatus,
  selectClearAnnotationError,
  selectCreateNoteAnnotation,
  selectDeleteAnnotation,
  selectLoadAnnotations,
} from '@/stores/selectors/annotationSelectors'
import {
  selectClearPdfOutline,
  selectClearPdfOutlineError,
  selectLoadPdfOutline,
  selectPdfOutlineErrorMessage,
  selectPdfOutlineItems,
  selectPdfOutlineStatus,
} from '@/stores/selectors/pdfOutlineSelectors'
import {
  selectClearPdfTextSearch,
  selectClearPdfTextSearchError,
  selectPdfTextSearchCompletedPages,
  selectPdfTextSearchErrorMessage,
  selectPdfTextSearchQuery,
  selectPdfTextSearchResult,
  selectPdfTextSearchStatus,
  selectPdfTextSearchTotalPages,
  selectSearchPdfText,
} from '@/stores/selectors/pdfTextSearchSelectors'
import {
  selectReaderSettings,
} from '@/stores/selectors/readerSettingsSelectors'
import {
  selectBookmarkErrorMessage,
  selectBookmarkMutationStatus,
  selectBookmarks,
  selectBookmarksLoadStatus,
  selectClearBookmarkError,
  selectClearContinuousPdfPages,
  selectClearReaderError,
  selectClearThumbnailPagesLoadError,
  selectClearSecondaryPdfPage,
  selectCloseBook,
  selectContinuousHasNextPages,
  selectThumbnailHasNextPages,
  selectThumbnailHasPreviousPages,
  selectContinuousHasPreviousPages,
  selectContinuousPagesLoadErrorMessage,
  selectThumbnailPagesLoadErrorMessage,
  selectContinuousPagesLoadStatus,
  selectThumbnailPagesLoadStatus,
  selectCreateCurrentPageBookmark,
  selectCurrentPage,
  selectDeleteBookmark,
  selectLoadedContinuousPdfPages,
  selectLoadedThumbnailPdfPages,
  selectLoadedPdfDocument,
  selectLoadedPdfPage,
  selectLoadedSecondaryPdfPage,
  selectLoadBookmarks,
  selectLoadInitialContinuousPdfPages,
  selectLoadInitialThumbnailPdfPages,
  selectLoadNextContinuousPdfPages,
  selectLoadNextThumbnailPdfPages,
  selectLoadPdfPage,
  selectLoadPreviousContinuousPdfPages,
  selectLoadPreviousThumbnailPdfPages,
  selectLoadSecondaryPdfPage,
  selectOpenedBook,
  selectPageLoadErrorMessage,
  selectPageLoadStatus,
  selectPageOffsetRatio,
  selectReaderErrorMessage,
  selectSecondaryPageLoadErrorMessage,
  selectSecondaryPageLoadStatus,
  selectSetReadingPosition,
} from '@/stores/selectors/readerSelectors'
import {
  useAppStore,
} from '@/stores/useAppStore'

import '@/styles/components/reader-page.css'

const DEFAULT_PAGE_SCALE =
  READER_SETTINGS_CONFIG.defaults.customZoomScale

const MINIMUM_PAGE_SCALE =
  READER_SETTINGS_CONFIG.zoom.minimumScale

const MAXIMUM_PAGE_SCALE =
  READER_SETTINGS_CONFIG.zoom.maximumScale

const PAGE_SCALE_STEP =
  READER_SETTINGS_CONFIG.zoom.step

const DEFAULT_PAGE_ROTATION = 0
const DOUBLE_PAGE_GAP = 24
const CONTROLS_HIDE_DELAY_MS = 3000
const CONTINUOUS_LOAD_ROOT_MARGIN =
  '600px 0px'
const CONTINUOUS_POSITION_THRESHOLD = 0.01

interface ContinuousScrollTarget {
  readonly pageNumber: number
  readonly pageOffsetRatio: number
}

interface StageContentViewport {
  readonly top: number
  readonly bottom: number
}

interface VisibleContinuousPagePosition {
  readonly pageNumber: number
  readonly pageOffsetRatio: number
}

function BookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 7.5v5" />
      <path d="M12 16.5h.01" />
    </svg>
  )
}

function clampPageScale(
  scale: number,
): number {
  if (!Number.isFinite(scale)) {
    return DEFAULT_PAGE_SCALE
  }

  return Math.min(
    Math.max(
      scale,
      MINIMUM_PAGE_SCALE,
    ),
    MAXIMUM_PAGE_SCALE,
  )
}

function roundPageScale(
  scale: number,
): number {
  return (
    Math.round(scale * 100) / 100
  )
}

function normalizePageRotation(
  rotation: number,
): number {
  if (!Number.isFinite(rotation)) {
    return DEFAULT_PAGE_ROTATION
  }

  const snappedRotation =
    Math.round(rotation / 90) * 90

  const normalizedRotation =
    snappedRotation % 360

  return normalizedRotation < 0
    ? normalizedRotation + 360
    : normalizedRotation
}

function normalizePageNumber(
  pageNumber: number,
  totalPages: number,
): number {
  if (
    !Number.isFinite(pageNumber) ||
    totalPages <= 0
  ) {
    return 1
  }

  return Math.min(
    Math.max(
      Math.trunc(pageNumber),
      1,
    ),
    totalPages,
  )
}

function normalizePageOffsetRatio(
  pageOffsetRatio: number,
): number {
  if (!Number.isFinite(pageOffsetRatio)) {
    return 0
  }

  return Math.min(
    Math.max(pageOffsetRatio, 0),
    1,
  )
}

function parseCssPixelValue(
  value: string,
): number {
  const parsedValue =
    Number.parseFloat(value)

  return Number.isFinite(parsedValue)
    ? parsedValue
    : 0
}

function getAvailableStageWidth(
  stageElement: HTMLDivElement,
): number {
  const computedStyle =
    window.getComputedStyle(stageElement)

  const horizontalPadding =
    parseCssPixelValue(
      computedStyle.paddingLeft,
    ) +
    parseCssPixelValue(
      computedStyle.paddingRight,
    )

  return Math.max(
    0,
    stageElement.clientWidth -
      horizontalPadding,
  )
}

function getAvailableStageHeight(
  stageElement: HTMLDivElement,
): number {
  const computedStyle =
    window.getComputedStyle(stageElement)

  const verticalPadding =
    parseCssPixelValue(
      computedStyle.paddingTop,
    ) +
    parseCssPixelValue(
      computedStyle.paddingBottom,
    )

  return Math.max(
    0,
    stageElement.clientHeight -
      verticalPadding,
  )
}

function getStageContentViewport(
  stageElement: HTMLDivElement,
): StageContentViewport {
  const stageRect =
    stageElement.getBoundingClientRect()

  const computedStyle =
    window.getComputedStyle(stageElement)

  const paddingTop =
    parseCssPixelValue(
      computedStyle.paddingTop,
    )

  const paddingBottom =
    parseCssPixelValue(
      computedStyle.paddingBottom,
    )

  return {
    top:
      stageRect.top +
      paddingTop,

    bottom:
      stageRect.bottom -
      paddingBottom,
  }
}

function findContinuousPageElement(
  stageElement: HTMLDivElement,
  pageNumber: number,
): HTMLElement | null {
  return stageElement.querySelector<HTMLElement>(
    `[data-page-number="${pageNumber}"]`,
  )
}

function resolveVisibleContinuousPagePosition(
  stageElement: HTMLDivElement,
): VisibleContinuousPagePosition | null {
  const pageElements =
    stageElement.querySelectorAll<HTMLElement>(
      '[data-page-number]',
    )

  if (pageElements.length === 0) {
    return null
  }

  const viewport =
    getStageContentViewport(
      stageElement,
    )

  let selectedPageElement:
    HTMLElement | null = null

  let selectedVisibleHeight = -1
  let selectedDistanceFromTop =
    Number.POSITIVE_INFINITY

  for (const pageElement of pageElements) {
    const pageRect =
      pageElement.getBoundingClientRect()

    const visibleTop = Math.max(
      pageRect.top,
      viewport.top,
    )

    const visibleBottom = Math.min(
      pageRect.bottom,
      viewport.bottom,
    )

    const visibleHeight = Math.max(
      0,
      visibleBottom - visibleTop,
    )

    if (visibleHeight <= 0) {
      continue
    }

    const distanceFromTop =
      Math.abs(
        pageRect.top -
        viewport.top,
      )

    const hasGreaterVisibleArea =
      visibleHeight >
      selectedVisibleHeight

    const hasEqualVisibleArea =
      Math.abs(
        visibleHeight -
        selectedVisibleHeight,
      ) < 0.5

    if (
      hasGreaterVisibleArea ||
      (
        hasEqualVisibleArea &&
        distanceFromTop <
          selectedDistanceFromTop
      )
    ) {
      selectedPageElement =
        pageElement

      selectedVisibleHeight =
        visibleHeight

      selectedDistanceFromTop =
        distanceFromTop
    }
  }

  if (selectedPageElement === null) {
    return null
  }

  const pageNumber = Number.parseInt(
    selectedPageElement.dataset
      .pageNumber ?? '',
    10,
  )

  if (
    !Number.isFinite(pageNumber) ||
    pageNumber <= 0
  ) {
    return null
  }

  const selectedPageRect =
    selectedPageElement
      .getBoundingClientRect()

  const pageOffsetRatio =
    selectedPageRect.height <= 0
      ? 0
      : normalizePageOffsetRatio(
          (
            viewport.top -
            selectedPageRect.top
          ) /
          selectedPageRect.height,
        )

  return {
    pageNumber,
    pageOffsetRatio,
  }
}

function scrollToContinuousPagePosition(
  stageElement: HTMLDivElement,
  target: ContinuousScrollTarget,
  behavior: ScrollBehavior = 'auto',
): boolean {
  const pageElement =
    findContinuousPageElement(
      stageElement,
      target.pageNumber,
    )

  if (pageElement === null) {
    return false
  }

  const viewport =
    getStageContentViewport(
      stageElement,
    )

  const pageRect =
    pageElement.getBoundingClientRect()

  const pageOffset =
    normalizePageOffsetRatio(
      target.pageOffsetRatio,
    ) * pageRect.height

  const scrollDelta =
    pageRect.top -
    viewport.top +
    pageOffset

  stageElement.scrollTo({
    top: Math.max(
      0,
      stageElement.scrollTop +
        scrollDelta,
    ),
    behavior,
  })

  return true
}

export function ReaderPage() {
  const {
    immersiveMode,
  } = useAppShell()

  const openedBook = useAppStore(
    selectOpenedBook,
  )

  const loadedPdfDocument = useAppStore(
    selectLoadedPdfDocument,
  )

  const loadedPdfPage = useAppStore(
    selectLoadedPdfPage,
  )

  const loadedSecondaryPdfPage =
    useAppStore(
      selectLoadedSecondaryPdfPage,
    )

  const loadedContinuousPdfPages =
    useAppStore(
      selectLoadedContinuousPdfPages,
    )

  const loadedThumbnailPdfPages =
    useAppStore(
      selectLoadedThumbnailPdfPages,
    )

  const readerSettings = useAppStore(
    selectReaderSettings,
  )

  const bookmarks = useAppStore(
    selectBookmarks,
  )

  const annotations = useAppStore(
    selectAnnotations,
  )

  const pdfOutlineItems = useAppStore(
    selectPdfOutlineItems,
  )

  const pdfOutlineStatus = useAppStore(
    selectPdfOutlineStatus,
  )

  const pdfOutlineErrorMessage =
    useAppStore(
      selectPdfOutlineErrorMessage,
    )

  const pdfTextSearchQuery =
    useAppStore(
      selectPdfTextSearchQuery,
    )

  const pdfTextSearchResult =
    useAppStore(
      selectPdfTextSearchResult,
    )

  const pdfTextSearchStatus =
    useAppStore(
      selectPdfTextSearchStatus,
    )

  const pdfTextSearchCompletedPages =
    useAppStore(
      selectPdfTextSearchCompletedPages,
    )

  const pdfTextSearchTotalPages =
    useAppStore(
      selectPdfTextSearchTotalPages,
    )

  const pdfTextSearchErrorMessage =
    useAppStore(
      selectPdfTextSearchErrorMessage,
    )

  const currentPage = useAppStore(
    selectCurrentPage,
  )

  const pageOffsetRatio = useAppStore(
    selectPageOffsetRatio,
  )

  const pageLoadStatus = useAppStore(
    selectPageLoadStatus,
  )

  const secondaryPageLoadStatus =
    useAppStore(
      selectSecondaryPageLoadStatus,
    )

  const continuousPagesLoadStatus =
    useAppStore(
      selectContinuousPagesLoadStatus,
    )

  const thumbnailPagesLoadStatus =
    useAppStore(
      selectThumbnailPagesLoadStatus,
    )

  const continuousHasPreviousPages =
    useAppStore(
      selectContinuousHasPreviousPages,
    )

  const continuousHasNextPages =
    useAppStore(
      selectContinuousHasNextPages,
    )

  const thumbnailHasPreviousPages =
    useAppStore(
      selectThumbnailHasPreviousPages,
    )

  const thumbnailHasNextPages =
    useAppStore(
      selectThumbnailHasNextPages,
    )

  const bookmarksLoadStatus = useAppStore(
    selectBookmarksLoadStatus,
  )

  const bookmarkMutationStatus =
    useAppStore(
      selectBookmarkMutationStatus,
    )

  const annotationsLoadStatus =
    useAppStore(
      selectAnnotationsLoadStatus,
    )

  const annotationMutationStatus =
    useAppStore(
      selectAnnotationMutationStatus,
    )

  const readerErrorMessage = useAppStore(
    selectReaderErrorMessage,
  )

  const pageLoadErrorMessage = useAppStore(
    selectPageLoadErrorMessage,
  )

  const secondaryPageLoadErrorMessage =
    useAppStore(
      selectSecondaryPageLoadErrorMessage,
    )

  const continuousPagesLoadErrorMessage =
    useAppStore(
      selectContinuousPagesLoadErrorMessage,
    )

  const thumbnailPagesLoadErrorMessage =
    useAppStore(
      selectThumbnailPagesLoadErrorMessage,
    )

  const bookmarkErrorMessage =
    useAppStore(
      selectBookmarkErrorMessage,
    )

  const annotationErrorMessage =
    useAppStore(
      selectAnnotationErrorMessage,
    )

  const loadPdfPage = useAppStore(
    selectLoadPdfPage,
  )

  const loadSecondaryPdfPage =
    useAppStore(
      selectLoadSecondaryPdfPage,
    )

  const clearSecondaryPdfPage =
    useAppStore(
      selectClearSecondaryPdfPage,
    )

  const loadInitialContinuousPdfPages =
    useAppStore(
      selectLoadInitialContinuousPdfPages,
    )

  const loadInitialThumbnailPdfPages =
    useAppStore(
      selectLoadInitialThumbnailPdfPages,
    )

  const loadPreviousContinuousPdfPages =
    useAppStore(
      selectLoadPreviousContinuousPdfPages,
    )

  const loadPreviousThumbnailPdfPages =
    useAppStore(
      selectLoadPreviousThumbnailPdfPages,
    )

  const loadNextContinuousPdfPages =
    useAppStore(
      selectLoadNextContinuousPdfPages,
    )

  const loadNextThumbnailPdfPages =
    useAppStore(
      selectLoadNextThumbnailPdfPages,
    )

  const clearContinuousPdfPages =
    useAppStore(
      selectClearContinuousPdfPages,
    )

  const loadBookmarks = useAppStore(
    selectLoadBookmarks,
  )

  const createCurrentPageBookmark =
    useAppStore(
      selectCreateCurrentPageBookmark,
    )

  const deleteBookmark = useAppStore(
    selectDeleteBookmark,
  )

  const loadAnnotations = useAppStore(
    selectLoadAnnotations,
  )

  const createNoteAnnotation =
    useAppStore(
      selectCreateNoteAnnotation,
    )

  const deleteAnnotation =
    useAppStore(
      selectDeleteAnnotation,
    )

  const clearAnnotationError =
    useAppStore(
      selectClearAnnotationError,
    )

  const loadPdfOutline = useAppStore(
    selectLoadPdfOutline,
  )

  const clearPdfOutline = useAppStore(
    selectClearPdfOutline,
  )

  const clearPdfOutlineError =
    useAppStore(
      selectClearPdfOutlineError,
    )

  const setReadingPosition = useAppStore(
    selectSetReadingPosition,
  )

  const closeBook = useAppStore(
    selectCloseBook,
  )

  const clearReaderError = useAppStore(
    selectClearReaderError,
  )

  const clearThumbnailPagesLoadError =
    useAppStore(
      selectClearThumbnailPagesLoadError,
    )

  const clearBookmarkError = useAppStore(
    selectClearBookmarkError,
  )

  const searchPdfText = useAppStore(
    selectSearchPdfText,
  )

  const clearPdfTextSearch =
    useAppStore(
      selectClearPdfTextSearch,
    )

  const clearPdfTextSearchError =
    useAppStore(
      selectClearPdfTextSearchError,
    )

  const stageRef =
    useRef<HTMLDivElement>(null)

  const appliedZoomConfigurationRef =
    useRef<string | null>(null)

  const controlsHideTimeoutRef =
    useRef<number | null>(null)

  const continuousScrollFrameRef =
    useRef<number | null>(null)

  const pendingContinuousScrollTargetRef =
    useRef<ContinuousScrollTarget | null>(
      null,
    )

  const [
    panelOpen,
    setPanelOpen,
  ] = useState(true)

  const [
    activePanelSection,
    setActivePanelSection,
  ] = useState<ReaderPanelSection>(
    ReaderPanelSection.OUTLINE,
  )

  useEffect(() => {
    if (
      !panelOpen ||
      activePanelSection !== ReaderPanelSection.THUMBNAILS ||
      openedBook === null ||
      loadedPdfDocument === null ||
      loadedThumbnailPdfPages.length > 0 ||
      thumbnailPagesLoadStatus !== AsyncStatus.IDLE
    ) {
      return
    }

    void loadInitialThumbnailPdfPages()
  }, [
    panelOpen,
    activePanelSection,
    openedBook,
    loadedPdfDocument,
    loadedThumbnailPdfPages.length,
    thumbnailPagesLoadStatus,
    loadInitialThumbnailPdfPages,
  ])

  const [
    searchFocusRequestId,
    setSearchFocusRequestId,
  ] = useState(0)

  const [
    activePdfTextSearchOccurrence,
    setActivePdfTextSearchOccurrence,
  ] = useState<
    PdfTextSearchOccurrence | null
  >(null)

  const [
    pageScale,
    setPageScale,
  ] = useState<number>(
    DEFAULT_PAGE_SCALE,
  )

  const [
    pageRotation,
    setPageRotation,
  ] = useState<number>(
    DEFAULT_PAGE_ROTATION,
  )

  const [
    controlsHidden,
    setControlsHidden,
  ] = useState(false)

  const totalPages =
    openedBook?.book.totalPages ?? 0

  const isPageLoading =
    pageLoadStatus ===
    AsyncStatus.LOADING

  const isSecondaryPageLoading =
    secondaryPageLoadStatus ===
    AsyncStatus.LOADING

  const isContinuousPagesLoading =
    continuousPagesLoadStatus ===
    AsyncStatus.LOADING

  const areBookmarksLoading =
    bookmarksLoadStatus ===
    AsyncStatus.LOADING

  const isBookmarkMutating =
    bookmarkMutationStatus ===
    AsyncStatus.LOADING

  const areAnnotationsLoading =
    annotationsLoadStatus ===
    AsyncStatus.LOADING

  const isAnnotationMutating =
    annotationMutationStatus ===
    AsyncStatus.LOADING

  const isPdfOutlineLoading =
    pdfOutlineStatus ===
    AsyncStatus.LOADING

  const isPdfTextSearching =
    pdfTextSearchStatus ===
    AsyncStatus.LOADING

  const pdfTextSearchOccurrences =
    pdfTextSearchResult?.pageResults.flatMap(
      (pageResult) =>
        pageResult.occurrences,
    ) ?? []

  const loadedPageNumber =
    loadedPdfPage?.pageNumber ?? null

  const hasContinuousPages =
    loadedContinuousPdfPages.length > 0

  const configuredPageDisplayMode =
    readerSettings?.pageDisplayMode ??
    READER_SETTINGS_CONFIG.defaults
      .pageDisplayMode

  const configuredReadingFlowMode =
    readerSettings?.readingFlowMode ??
    READER_SETTINGS_CONFIG.defaults
      .readingFlowMode

  const configuredZoomMode =
    readerSettings?.zoomMode ??
    READER_SETTINGS_CONFIG.defaults
      .zoomMode

  const configuredCustomZoomScale =
    readerSettings?.customZoomScale ??
    READER_SETTINGS_CONFIG.defaults
      .customZoomScale

  const keyboardShortcutsEnabled =
    readerSettings
      ?.enableKeyboardShortcuts ??
    READER_SETTINGS_CONFIG.defaults
      .enableKeyboardShortcuts

  const autoHideReaderControls =
    readerSettings
      ?.autoHideReaderControls ??
    READER_SETTINGS_CONFIG.defaults
      .autoHideReaderControls

  const shouldAutoHideReaderControls =
    autoHideReaderControls ||
    immersiveMode

  const toolbarIsHidden =
    shouldAutoHideReaderControls &&
    controlsHidden

  const isContinuousMode =
    configuredReadingFlowMode ===
    ReadingFlowMode.CONTINUOUS

  const isPaginatedMode =
    configuredReadingFlowMode ===
    ReadingFlowMode.PAGINATED

  const isDoublePageMode =
    isPaginatedMode &&
    configuredPageDisplayMode ===
      PageDisplayMode.DOUBLE

  const pageNavigationStep =
    isDoublePageMode ? 2 : 1

  const hasPreviousPage =
    currentPage > 1

  const hasNextPage =
    isContinuousMode
      ? currentPage < totalPages
      : currentPage +
          pageNavigationStep <=
        totalPages

  const visiblePageCount =
    isDoublePageMode &&
    currentPage < totalPages
      ? 2
      : 1

  const continuousReferencePage =
    loadedContinuousPdfPages.find(
      (continuousPage) =>
        continuousPage.pageNumber ===
        currentPage,
    ) ??
    loadedContinuousPdfPages[0] ??
    null

  const zoomReferencePage =
    isContinuousMode
      ? continuousReferencePage
      : loadedPdfPage

  const documentControlsDisabled =
    isContinuousMode
      ? !hasContinuousPages
      : isPageLoading ||
        loadedPdfPage === null

  const navigationDisabled =
    isContinuousMode
      ? isContinuousPagesLoading &&
        !hasContinuousPages
      : isPageLoading

  const zoomConfigurationKey =
    openedBook === null
      ? null
      : [
          openedBook.book.id,
          readerSettings?.updatedAt ??
            'default-settings',
        ].join(':')

  const clearControlsHideTimeout =
    useCallback(() => {
      if (
        controlsHideTimeoutRef.current ===
        null
      ) {
        return
      }

      window.clearTimeout(
        controlsHideTimeoutRef.current,
      )

      controlsHideTimeoutRef.current =
        null
    }, [])

  const scheduleControlsHide =
    useCallback(() => {
      clearControlsHideTimeout()

      if (
        !shouldAutoHideReaderControls ||
        openedBook === null
      ) {
        return
      }

      controlsHideTimeoutRef.current =
        window.setTimeout(() => {
          setControlsHidden(true)

          controlsHideTimeoutRef.current =
            null
        }, CONTROLS_HIDE_DELAY_MS)
    }, [
      shouldAutoHideReaderControls,
      openedBook,
      clearControlsHideTimeout,
    ])

  const revealReaderControls =
    useCallback(() => {
      setControlsHidden(false)
      scheduleControlsHide()
    }, [scheduleControlsHide])

  const preserveContinuousReadingPosition =
    useCallback(() => {
      if (!isContinuousMode) {
        return
      }

      const latestReaderState =
        useAppStore.getState()

      pendingContinuousScrollTargetRef.current =
        {
          pageNumber:
            latestReaderState.currentPage,

          pageOffsetRatio:
            latestReaderState
              .pageOffsetRatio,
        }
    }, [isContinuousMode])

  const updateContinuousReadingPosition =
    useCallback(() => {
      if (
        !isContinuousMode ||
        pendingContinuousScrollTargetRef
          .current !== null
      ) {
        return
      }

      const stageElement =
        stageRef.current

      if (stageElement === null) {
        return
      }

      const visiblePosition =
        resolveVisibleContinuousPagePosition(
          stageElement,
        )

      if (visiblePosition === null) {
        return
      }

      const latestReaderState =
        useAppStore.getState()

      const pageChanged =
        latestReaderState.currentPage !==
        visiblePosition.pageNumber

      const offsetChanged =
        Math.abs(
          latestReaderState
            .pageOffsetRatio -
          visiblePosition
            .pageOffsetRatio,
        ) >=
        CONTINUOUS_POSITION_THRESHOLD

      if (
        !pageChanged &&
        !offsetChanged
      ) {
        return
      }

      setReadingPosition(
        visiblePosition.pageNumber,
        visiblePosition.pageOffsetRatio,
      )
    }, [
      isContinuousMode,
      setReadingPosition,
    ])

  const requestContinuousPositionUpdate =
    useCallback(() => {
      if (
        continuousScrollFrameRef.current !==
        null
      ) {
        return
      }

      continuousScrollFrameRef.current =
        window.requestAnimationFrame(() => {
          continuousScrollFrameRef.current =
            null

          updateContinuousReadingPosition()
        })
    }, [updateContinuousReadingPosition])

  const navigateToContinuousPosition =
    useCallback(
      async (
        targetPageNumber: number,
        targetPageOffsetRatio = 0,
      ) => {
        if (
          !isContinuousMode ||
          totalPages <= 0
        ) {
          return
        }

        const target:
          ContinuousScrollTarget = {
            pageNumber:
              normalizePageNumber(
                targetPageNumber,
                totalPages,
              ),

            pageOffsetRatio:
              normalizePageOffsetRatio(
                targetPageOffsetRatio,
              ),
          }

        setReadingPosition(
          target.pageNumber,
          target.pageOffsetRatio,
        )

        pendingContinuousScrollTargetRef.current =
          target

        const stageElement =
          stageRef.current

        if (
          stageElement !== null &&
          scrollToContinuousPagePosition(
            stageElement,
            target,
          )
        ) {
          pendingContinuousScrollTargetRef.current =
            null

          requestContinuousPositionUpdate()
          return
        }

        await loadInitialContinuousPdfPages()

        if (
          useAppStore.getState()
            .continuousPagesLoadStatus ===
          AsyncStatus.ERROR
        ) {
          pendingContinuousScrollTargetRef.current =
            null
        }
      },
      [
        isContinuousMode,
        totalPages,
        setReadingPosition,
        loadInitialContinuousPdfPages,
        requestContinuousPositionUpdate,
      ],
    )

  const handleLoadPreviousContinuousPages =
    useCallback(async () => {
      if (
        !isContinuousMode ||
        isContinuousPagesLoading ||
        !continuousHasPreviousPages
      ) {
        return
      }

      preserveContinuousReadingPosition()

      await loadPreviousContinuousPdfPages()

      if (
        useAppStore.getState()
          .continuousPagesLoadStatus ===
        AsyncStatus.ERROR
      ) {
        pendingContinuousScrollTargetRef.current =
          null
      }
    }, [
      isContinuousMode,
      isContinuousPagesLoading,
      continuousHasPreviousPages,
      preserveContinuousReadingPosition,
      loadPreviousContinuousPdfPages,
    ])

  const handleLoadNextContinuousPages =
    useCallback(async () => {
      if (
        !isContinuousMode ||
        isContinuousPagesLoading ||
        !continuousHasNextPages
      ) {
        return
      }

      await loadNextContinuousPdfPages()
    }, [
      isContinuousMode,
      isContinuousPagesLoading,
      continuousHasNextPages,
      loadNextContinuousPdfPages,
    ])

  useEffect(() => {
    if (!shouldAutoHideReaderControls) {
      clearControlsHideTimeout()

      const animationFrameId =
        window.requestAnimationFrame(() => {
          setControlsHidden(false)
        })

      return () => {
        window.cancelAnimationFrame(
          animationFrameId,
        )
      }
    }

    const handleReaderActivity = () => {
      revealReaderControls()
    }

    window.addEventListener(
      'pointermove',
      handleReaderActivity,
      {
        passive: true,
      },
    )

    window.addEventListener(
      'pointerdown',
      handleReaderActivity,
      {
        passive: true,
      },
    )

    window.addEventListener(
      'touchstart',
      handleReaderActivity,
      {
        passive: true,
      },
    )

    window.addEventListener(
      'keydown',
      handleReaderActivity,
    )

    window.addEventListener(
      'focusin',
      handleReaderActivity,
    )

    const animationFrameId =
      window.requestAnimationFrame(() => {
        revealReaderControls()
      })

    return () => {
      window.cancelAnimationFrame(
        animationFrameId,
      )

      clearControlsHideTimeout()

      window.removeEventListener(
        'pointermove',
        handleReaderActivity,
      )

      window.removeEventListener(
        'pointerdown',
        handleReaderActivity,
      )

      window.removeEventListener(
        'touchstart',
        handleReaderActivity,
      )

      window.removeEventListener(
        'keydown',
        handleReaderActivity,
      )

      window.removeEventListener(
        'focusin',
        handleReaderActivity,
      )
    }
  }, [
    shouldAutoHideReaderControls,
    revealReaderControls,
    clearControlsHideTimeout,
  ])

  useEffect(() => {
    if (!immersiveMode) {
      return
    }

    const animationFrameId =
      window.requestAnimationFrame(() => {
        setPanelOpen(false)
      })

    return () => {
      window.cancelAnimationFrame(
        animationFrameId,
      )
    }
  }, [immersiveMode])

  useEffect(() => {
    if (
      openedBook === null ||
      loadedPdfDocument === null ||
      loadedPdfDocument.isClosed ||
      totalPages <= 0
    ) {
      return
    }

    if (isContinuousMode) {
      if (
        loadedContinuousPdfPages.length ===
          0 &&
        continuousPagesLoadStatus ===
          AsyncStatus.IDLE
      ) {
        pendingContinuousScrollTargetRef.current =
          {
            pageNumber: currentPage,
            pageOffsetRatio,
          }

        void loadInitialContinuousPdfPages()
      }

      return
    }

    const hasContinuousReaderState =
      loadedContinuousPdfPages.length > 0 ||
      continuousPagesLoadStatus !==
        AsyncStatus.IDLE ||
      continuousPagesLoadErrorMessage !==
        null

    if (hasContinuousReaderState) {
      pendingContinuousScrollTargetRef.current =
        null

      clearContinuousPdfPages()
    }

    if (
      loadedPageNumber === currentPage ||
      isPageLoading
    ) {
      return
    }

    void loadPdfPage(currentPage)
  }, [
    openedBook,
    loadedPdfDocument,
    totalPages,
    isContinuousMode,
    loadedContinuousPdfPages.length,
    continuousPagesLoadStatus,
    continuousPagesLoadErrorMessage,
    currentPage,
    pageOffsetRatio,
    loadInitialContinuousPdfPages,
    clearContinuousPdfPages,
    loadedPageNumber,
    isPageLoading,
    loadPdfPage,
  ])

  useEffect(() => {
    if (
      openedBook === null ||
      bookmarksLoadStatus !==
        AsyncStatus.IDLE
    ) {
      return
    }

    void loadBookmarks()
  }, [
    openedBook,
    bookmarksLoadStatus,
    loadBookmarks,
  ])

  useEffect(() => {
    if (openedBook === null) {
      return
    }

    void loadAnnotations()
  }, [
    openedBook,
    loadAnnotations,
  ])

  useEffect(() => {
    if (
      openedBook === null ||
      loadedPdfDocument === null ||
      loadedPdfDocument.isClosed ||
      pdfOutlineStatus !==
        AsyncStatus.IDLE
    ) {
      return
    }

    void loadPdfOutline()
  }, [
    openedBook,
    loadedPdfDocument,
    pdfOutlineStatus,
    loadPdfOutline,
  ])

  useEffect(() => {
    return () => {
      clearPdfOutline()
    }
  }, [
    openedBook?.book.id,
    clearPdfOutline,
  ])

  useEffect(() => {
    return () => {
      clearPdfTextSearch()
    }
  }, [
    openedBook?.book.id,
    clearPdfTextSearch,
  ])

  useEffect(() => {
    if (!isDoublePageMode) {
      const hasSecondaryPageState =
        loadedSecondaryPdfPage !== null ||
        secondaryPageLoadStatus !==
          AsyncStatus.IDLE ||
        secondaryPageLoadErrorMessage !==
          null

      if (hasSecondaryPageState) {
        clearSecondaryPdfPage()
      }

      return
    }

    if (
      loadedPdfPage === null ||
      isPageLoading ||
      isSecondaryPageLoading
    ) {
      return
    }

    const expectedSecondaryPageNumber =
      loadedPdfPage.pageNumber + 1

    if (
      expectedSecondaryPageNumber >
      totalPages
    ) {
      const hasUnexpectedSecondaryState =
        loadedSecondaryPdfPage !== null ||
        secondaryPageLoadStatus !==
          AsyncStatus.IDLE ||
        secondaryPageLoadErrorMessage !==
          null

      if (hasUnexpectedSecondaryState) {
        clearSecondaryPdfPage()
      }

      return
    }

    const hasExpectedSecondaryPage =
      loadedSecondaryPdfPage
        ?.pageNumber ===
        expectedSecondaryPageNumber &&
      secondaryPageLoadStatus ===
        AsyncStatus.SUCCESS

    if (hasExpectedSecondaryPage) {
      return
    }

    void loadSecondaryPdfPage()
  }, [
    isDoublePageMode,
    loadedPdfPage,
    loadedSecondaryPdfPage,
    totalPages,
    isPageLoading,
    isSecondaryPageLoading,
    secondaryPageLoadStatus,
    secondaryPageLoadErrorMessage,
    loadSecondaryPdfPage,
    clearSecondaryPdfPage,
  ])

  useEffect(() => {
    if (
      !isContinuousMode ||
      loadedContinuousPdfPages.length ===
        0
    ) {
      return
    }

    const pendingTarget =
      pendingContinuousScrollTargetRef.current

    if (pendingTarget === null) {
      return
    }

    const animationFrameId =
      window.requestAnimationFrame(() => {
        const stageElement =
          stageRef.current

        if (stageElement === null) {
          return
        }

        const didScroll =
          scrollToContinuousPagePosition(
            stageElement,
            pendingTarget,
          )

        if (!didScroll) {
          return
        }

        pendingContinuousScrollTargetRef.current =
          null

        requestContinuousPositionUpdate()
      })

    return () => {
      window.cancelAnimationFrame(
        animationFrameId,
      )
    }
  }, [
    isContinuousMode,
    loadedContinuousPdfPages,
    pageScale,
    pageRotation,
    requestContinuousPositionUpdate,
  ])

  useEffect(() => {
    if (!isContinuousMode) {
      if (
        continuousScrollFrameRef.current !==
        null
      ) {
        window.cancelAnimationFrame(
          continuousScrollFrameRef.current,
        )

        continuousScrollFrameRef.current =
          null
      }

      return
    }

    const stageElement =
      stageRef.current

    if (stageElement === null) {
      return
    }

    const handleStageScroll = () => {
      requestContinuousPositionUpdate()
    }

    stageElement.addEventListener(
      'scroll',
      handleStageScroll,
      {
        passive: true,
      },
    )

    const animationFrameId =
      window.requestAnimationFrame(() => {
        requestContinuousPositionUpdate()
      })

    return () => {
      window.cancelAnimationFrame(
        animationFrameId,
      )

      stageElement.removeEventListener(
        'scroll',
        handleStageScroll,
      )

      if (
        continuousScrollFrameRef.current !==
        null
      ) {
        window.cancelAnimationFrame(
          continuousScrollFrameRef.current,
        )

        continuousScrollFrameRef.current =
          null
      }
    }
  }, [
    isContinuousMode,
    loadedContinuousPdfPages.length,
    requestContinuousPositionUpdate,
  ])

  useEffect(() => {
    if (
      !isContinuousMode ||
      isContinuousPagesLoading
    ) {
      return
    }

    const stageElement =
      stageRef.current

    if (stageElement === null) {
      return
    }

    const previousSentinel =
      stageElement.querySelector<HTMLElement>(
        '[data-continuous-load="previous"]',
      )

    const nextSentinel =
      stageElement.querySelector<HTMLElement>(
        '[data-continuous-load="next"]',
      )

    if (
      previousSentinel === null &&
      nextSentinel === null
    ) {
      return
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          const previousEntry =
            entries.find(
              (entry) =>
                entry.isIntersecting &&
                (
                  entry.target as
                    HTMLElement
                ).dataset
                  .continuousLoad ===
                  'previous',
            )

          if (
            previousEntry !== undefined &&
            continuousHasPreviousPages
          ) {
            void handleLoadPreviousContinuousPages()
            return
          }

          const nextEntry =
            entries.find(
              (entry) =>
                entry.isIntersecting &&
                (
                  entry.target as
                    HTMLElement
                ).dataset
                  .continuousLoad ===
                  'next',
            )

          if (
            nextEntry !== undefined &&
            continuousHasNextPages
          ) {
            void handleLoadNextContinuousPages()
          }
        },
        {
          root: stageElement,
          rootMargin:
            CONTINUOUS_LOAD_ROOT_MARGIN,
          threshold: 0.01,
        },
      )

    if (previousSentinel !== null) {
      observer.observe(
        previousSentinel,
      )
    }

    if (nextSentinel !== null) {
      observer.observe(
        nextSentinel,
      )
    }

    return () => {
      observer.disconnect()
    }
  }, [
    isContinuousMode,
    isContinuousPagesLoading,
    loadedContinuousPdfPages.length,
    continuousHasPreviousPages,
    continuousHasNextPages,
    handleLoadPreviousContinuousPages,
    handleLoadNextContinuousPages,
  ])

  const handleBackToLibrary =
    useCallback(async () => {
      clearControlsHideTimeout()

      await closeBook()

      navigateToAppRoute(
        AppRoute.LIBRARY,
      )
    }, [
      closeBook,
      clearControlsHideTimeout,
    ])

  const handlePreviousPage =
    useCallback(() => {
      if (
        navigationDisabled ||
        !hasPreviousPage
      ) {
        return
      }

      revealReaderControls()

      const previousPage =
        Math.max(
          1,
          currentPage -
            pageNavigationStep,
        )

      if (isContinuousMode) {
        void navigateToContinuousPosition(
          previousPage,
        )

        return
      }

      void loadPdfPage(
        previousPage,
      )
    }, [
      navigationDisabled,
      hasPreviousPage,
      currentPage,
      pageNavigationStep,
      isContinuousMode,
      navigateToContinuousPosition,
      loadPdfPage,
      revealReaderControls,
    ])

  const handleNextPage =
    useCallback(() => {
      if (
        navigationDisabled ||
        !hasNextPage
      ) {
        return
      }

      revealReaderControls()

      const nextPage =
        Math.min(
          totalPages,
          currentPage +
            pageNavigationStep,
        )

      if (isContinuousMode) {
        void navigateToContinuousPosition(
          nextPage,
        )

        return
      }

      void loadPdfPage(
        nextPage,
      )
    }, [
      navigationDisabled,
      hasNextPage,
      totalPages,
      currentPage,
      pageNavigationStep,
      isContinuousMode,
      navigateToContinuousPosition,
      loadPdfPage,
      revealReaderControls,
    ])

  const handleScaleChange =
    useCallback(
      (
        nextScale: number,
      ) => {
        const normalizedScale =
          roundPageScale(
            clampPageScale(
              nextScale,
            ),
          )

        if (normalizedScale === pageScale) {
          return
        }

        preserveContinuousReadingPosition()
        setPageScale(normalizedScale)
      },
      [
        pageScale,
        preserveContinuousReadingPosition,
      ],
    )

  const handleRotationChange =
    useCallback(
      (
        nextRotation: number,
      ) => {
        const normalizedRotation =
          normalizePageRotation(
            nextRotation,
          )

        if (
          normalizedRotation ===
          pageRotation
        ) {
          return
        }

        preserveContinuousReadingPosition()
        setPageRotation(normalizedRotation)
      },
      [
        pageRotation,
        preserveContinuousReadingPosition,
      ],
    )

  const handleFitWidth =
    useCallback(() => {
      const stageElement =
        stageRef.current

      if (
        stageElement === null ||
        zoomReferencePage === null
      ) {
        return
      }

      const availableWidth =
        getAvailableStageWidth(
          stageElement,
        )

      if (availableWidth <= 0) {
        return
      }

      const baseViewport =
        zoomReferencePage.getViewport({
          scale: 1,
          rotation: pageRotation,
        })

      if (
        !Number.isFinite(
          baseViewport.width,
        ) ||
        baseViewport.width <= 0
      ) {
        return
      }

      const totalGap =
        visiblePageCount > 1
          ? DOUBLE_PAGE_GAP
          : 0

      const combinedPageWidth =
        baseViewport.width *
          visiblePageCount +
        totalGap

      const fitScale =
        availableWidth /
        combinedPageWidth

      handleScaleChange(
        fitScale,
      )
    }, [
      zoomReferencePage,
      pageRotation,
      visiblePageCount,
      handleScaleChange,
    ])

  const handleFitPage =
    useCallback(() => {
      const stageElement =
        stageRef.current

      if (
        stageElement === null ||
        zoomReferencePage === null
      ) {
        return
      }

      const availableWidth =
        getAvailableStageWidth(
          stageElement,
        )

      const availableHeight =
        getAvailableStageHeight(
          stageElement,
        )

      if (
        availableWidth <= 0 ||
        availableHeight <= 0
      ) {
        handleFitWidth()
        return
      }

      const baseViewport =
        zoomReferencePage.getViewport({
          scale: 1,
          rotation: pageRotation,
        })

      if (
        !Number.isFinite(
          baseViewport.width,
        ) ||
        !Number.isFinite(
          baseViewport.height,
        ) ||
        baseViewport.width <= 0 ||
        baseViewport.height <= 0
      ) {
        return
      }

      const totalGap =
        visiblePageCount > 1
          ? DOUBLE_PAGE_GAP
          : 0

      const combinedPageWidth =
        baseViewport.width *
          visiblePageCount +
        totalGap

      const widthScale =
        availableWidth /
        combinedPageWidth

      const heightScale =
        availableHeight /
        baseViewport.height

      handleScaleChange(
        Math.min(
          widthScale,
          heightScale,
        ),
      )
    }, [
      zoomReferencePage,
      pageRotation,
      visiblePageCount,
      handleFitWidth,
      handleScaleChange,
    ])

  useEffect(() => {
    if (
      zoomReferencePage === null ||
      documentControlsDisabled ||
      zoomConfigurationKey === null ||
      appliedZoomConfigurationRef.current ===
        zoomConfigurationKey
    ) {
      return
    }

    const animationFrameId =
      window.requestAnimationFrame(() => {
        switch (configuredZoomMode) {
          case ZoomMode.CUSTOM:
            handleScaleChange(
              configuredCustomZoomScale,
            )
            break

          case ZoomMode.FIT_PAGE:
            handleFitPage()
            break

          case ZoomMode.FIT_WIDTH:
            handleFitWidth()
            break
        }

        appliedZoomConfigurationRef.current =
          zoomConfigurationKey
      })

    return () => {
      window.cancelAnimationFrame(
        animationFrameId,
      )
    }
  }, [
    zoomReferencePage,
    documentControlsDisabled,
    zoomConfigurationKey,
    configuredZoomMode,
    configuredCustomZoomScale,
    handleScaleChange,
    handleFitPage,
    handleFitWidth,
  ])

  const handleOpenThumbnailPage =
    useCallback((pageNumber: number) => {
      revealReaderControls()
      setReadingPosition(pageNumber, 0)
    }, [revealReaderControls, setReadingPosition])

  const handleTogglePanel =
    useCallback(() => {
      revealReaderControls()

      setPanelOpen(
        (currentPanelState) =>
          !currentPanelState,
      )
    }, [revealReaderControls])

  const handleClosePanel =
    useCallback(() => {
      setPanelOpen(false)
    }, [])

  const handlePanelSectionChange =
    useCallback(
      (
        section: ReaderPanelSection,
      ) => {
        revealReaderControls()

        setActivePanelSection(
          section,
        )
      },
      [revealReaderControls],
    )

  const handleFocusSearch =
    useCallback(() => {
      revealReaderControls()

      setActivePanelSection(
        ReaderPanelSection.SEARCH,
      )

      setPanelOpen(true)

      setSearchFocusRequestId(
        (currentRequestId) =>
          currentRequestId + 1,
      )
    }, [revealReaderControls])

  const handleKeyboardZoomIn =
    useCallback(() => {
      if (documentControlsDisabled) {
        return
      }

      handleScaleChange(
        pageScale +
          PAGE_SCALE_STEP,
      )
    }, [
      documentControlsDisabled,
      pageScale,
      handleScaleChange,
    ])

  const handleKeyboardZoomOut =
    useCallback(() => {
      if (documentControlsDisabled) {
        return
      }

      handleScaleChange(
        pageScale -
          PAGE_SCALE_STEP,
      )
    }, [
      documentControlsDisabled,
      pageScale,
      handleScaleChange,
    ])

  const handleKeyboardResetZoom =
    useCallback(() => {
      if (documentControlsDisabled) {
        return
      }

      switch (configuredZoomMode) {
        case ZoomMode.CUSTOM:
          handleScaleChange(
            configuredCustomZoomScale,
          )
          break

        case ZoomMode.FIT_PAGE:
          handleFitPage()
          break

        case ZoomMode.FIT_WIDTH:
          handleFitWidth()
          break
      }
    }, [
      documentControlsDisabled,
      configuredZoomMode,
      configuredCustomZoomScale,
      handleScaleChange,
      handleFitPage,
      handleFitWidth,
    ])

  const handleKeyboardFitWidth =
    useCallback(() => {
      if (documentControlsDisabled) {
        return
      }

      handleFitWidth()
    }, [
      documentControlsDisabled,
      handleFitWidth,
    ])

  const handleKeyboardRotateLeft =
    useCallback(() => {
      if (documentControlsDisabled) {
        return
      }

      handleRotationChange(
        pageRotation - 90,
      )
    }, [
      documentControlsDisabled,
      pageRotation,
      handleRotationChange,
    ])

  const handleKeyboardRotateRight =
    useCallback(() => {
      if (documentControlsDisabled) {
        return
      }

      handleRotationChange(
        pageRotation + 90,
      )
    }, [
      documentControlsDisabled,
      pageRotation,
      handleRotationChange,
    ])

  const handleAddCurrentPageBookmark =
    useCallback(async () => {
      revealReaderControls()

      await createCurrentPageBookmark()
    }, [
      createCurrentPageBookmark,
      revealReaderControls,
    ])

  const handleOpenPdfOutlineItem =
    useCallback(
      async (
        item: PdfOutlineItem,
      ) => {
        if (
          navigationDisabled ||
          item.pageNumber === null
        ) {
          return
        }

        revealReaderControls()

        if (isContinuousMode) {
          await navigateToContinuousPosition(
            item.pageNumber,
          )

          return
        }

        await loadPdfPage(
          item.pageNumber,
        )

        const latestReaderState =
          useAppStore.getState()

        if (
          latestReaderState
            .loadedPdfPage
            ?.pageNumber !==
          item.pageNumber
        ) {
          return
        }

        setReadingPosition(
          item.pageNumber,
          0,
        )
      },
      [
        navigationDisabled,
        isContinuousMode,
        navigateToContinuousPosition,
        loadPdfPage,
        setReadingPosition,
        revealReaderControls,
      ],
    )
  const handleOpenBookmark =
    useCallback(
      async (
        bookmark: Bookmark,
      ) => {
        if (navigationDisabled) {
          return
        }

        revealReaderControls()

        if (isContinuousMode) {
          await navigateToContinuousPosition(
            bookmark.pageNumber,
            bookmark.pageOffsetRatio,
          )

          return
        }

        await loadPdfPage(
          bookmark.pageNumber,
        )

        const latestReaderState =
          useAppStore.getState()

        if (
          latestReaderState
            .loadedPdfPage
            ?.pageNumber !==
          bookmark.pageNumber
        ) {
          return
        }

        setReadingPosition(
          bookmark.pageNumber,
          bookmark.pageOffsetRatio,
        )
      },
      [
        navigationDisabled,
        isContinuousMode,
        navigateToContinuousPosition,
        loadPdfPage,
        setReadingPosition,
        revealReaderControls,
      ],
    )

  const handleAddNote =
    useCallback(
      async (
        content: string,
      ) => {
        revealReaderControls()

        await createNoteAnnotation({
          pageNumber: currentPage,
          pageOffsetRatio,
          content,
        })
      },
      [
        currentPage,
        pageOffsetRatio,
        createNoteAnnotation,
        revealReaderControls,
      ],
    )

  const handleOpenAnnotation =
    useCallback(
      async (
        annotation: Annotation,
      ) => {
        if (navigationDisabled) {
          return
        }

        revealReaderControls()

        if (isContinuousMode) {
          await navigateToContinuousPosition(
            annotation.pageNumber,
            annotation.pageOffsetRatio,
          )

          return
        }

        await loadPdfPage(
          annotation.pageNumber,
        )

        const latestReaderState =
          useAppStore.getState()

        if (
          latestReaderState
            .loadedPdfPage
            ?.pageNumber !==
          annotation.pageNumber
        ) {
          return
        }

        setReadingPosition(
          annotation.pageNumber,
          annotation.pageOffsetRatio,
        )
      },
      [
        navigationDisabled,
        isContinuousMode,
        navigateToContinuousPosition,
        loadPdfPage,
        setReadingPosition,
        revealReaderControls,
      ],
    )

  const handleDeleteAnnotation =
    useCallback(
      async (
        annotationId:
          Annotation['id'],
      ) => {
        revealReaderControls()

        await deleteAnnotation(
          annotationId,
        )
      },
      [
        deleteAnnotation,
        revealReaderControls,
      ],
    )

  const handleSearchPdfText =
    useCallback(
      async (
        query: string,
      ) => {
        setActivePdfTextSearchOccurrence(
          null,
        )

        await searchPdfText(
          query,
        )
      },
      [
        searchPdfText,
      ],
    )

  const handleClearPdfTextSearch =
    useCallback(() => {
      setActivePdfTextSearchOccurrence(
        null,
      )

      clearPdfTextSearch()
    }, [
      clearPdfTextSearch,
    ])

  const handleOpenPdfTextSearchOccurrence =
    useCallback(
      async (
        occurrence:
          PdfTextSearchOccurrence,
      ) => {
        if (navigationDisabled) {
          return
        }

        revealReaderControls()

        setActivePdfTextSearchOccurrence(
          occurrence,
        )

        if (isContinuousMode) {
          await navigateToContinuousPosition(
            occurrence.pageNumber,
            occurrence.pageOffsetRatio,
          )

          return
        }

        await loadPdfPage(
          occurrence.pageNumber,
        )

        const latestReaderState =
          useAppStore.getState()

        if (
          latestReaderState
            .loadedPdfPage
            ?.pageNumber !==
          occurrence.pageNumber
        ) {
          return
        }

        setReadingPosition(
          occurrence.pageNumber,
          occurrence.pageOffsetRatio,
        )
      },
      [
        navigationDisabled,
        isContinuousMode,
        navigateToContinuousPosition,
        loadPdfPage,
        setReadingPosition,
        revealReaderControls,
      ],
    )

  const handleDeleteBookmark =
    useCallback(
      async (
        bookmarkId:
          Bookmark['id'],
      ) => {
        revealReaderControls()

        await deleteBookmark(
          bookmarkId,
        )
      },
      [
        deleteBookmark,
        revealReaderControls,
      ],
    )

  useReaderKeyboardShortcuts({
    disabled:
      openedBook === null ||
      loadedPdfDocument === null ||
      !keyboardShortcutsEnabled,

    onPreviousPage:
      handlePreviousPage,

    onNextPage:
      handleNextPage,

    onZoomIn:
      handleKeyboardZoomIn,

    onZoomOut:
      handleKeyboardZoomOut,

    onResetZoom:
      handleKeyboardResetZoom,

    onFitWidth:
      handleKeyboardFitWidth,

    onRotateLeft:
      handleKeyboardRotateLeft,

    onRotateRight:
      handleKeyboardRotateRight,

    onTogglePanel:
      handleTogglePanel,

    onFocusSearch:
      handleFocusSearch,
  })

  if (
    openedBook === null ||
    loadedPdfDocument === null
  ) {
    return (
      <section
        className="reader-page"
        aria-label="Leitor de PDF"
      >
        <div className="reader-page__empty">
          <EmptyState
            title="Nenhum PDF está aberto"
            description="Volte para a biblioteca e selecione um documento para iniciar a leitura."
            icon={<BookIcon />}
            actions={
              <Button
                variant={
                  ButtonVariant.PRIMARY
                }
                onClick={() => {
                  navigateToAppRoute(
                    AppRoute.LIBRARY,
                  )
                }}
              >
                Ir para a biblioteca
              </Button>
            }
          />
        </div>
      </section>
    )
  }

  const workspaceClassName = [
    'reader-page__workspace',

    panelOpen
      ? 'reader-page__workspace--with-panel'
      : '',
  ]
    .filter(
      (className) =>
        className.length > 0,
    )
    .join(' ')

  return (
    <section
      className="reader-page"
      aria-label="Leitor de PDF"
    >
      {readerErrorMessage !== null && (
        <FeedbackMessage
          variant={
            FeedbackMessageVariant.WARNING
          }
          title="A leitura requer atenção"
          description={
            readerErrorMessage
          }
          icon={<ErrorIcon />}
          action={
            <Button
              variant={
                ButtonVariant.GHOST
              }
              onClick={
                clearReaderError
              }
            >
              Fechar
            </Button>
          }
        />
      )}

      <ReaderToolbar
        bookTitle={
          openedBook.book.title
        }
        originalFileName={
          openedBook.book
            .originalFileName
        }
        currentPage={currentPage}
        totalPages={totalPages}
        navigationDisabled={
          navigationDisabled
        }
        panelOpen={panelOpen}
        isHidden={toolbarIsHidden}
        zoomControls={
          <>
            <ReaderZoomControls
              scale={pageScale}
              minimumScale={
                MINIMUM_PAGE_SCALE
              }
              maximumScale={
                MAXIMUM_PAGE_SCALE
              }
              scaleStep={
                PAGE_SCALE_STEP
              }
              disabled={
                documentControlsDisabled
              }
              onScaleChange={
                handleScaleChange
              }
              onFitWidth={
                handleFitWidth
              }
            />

            <ReaderRotationControls
              rotation={pageRotation}
              disabled={
                documentControlsDisabled
              }
              onRotationChange={
                handleRotationChange
              }
            />
          </>
        }
        onBack={
          handleBackToLibrary
        }
        onPreviousPage={
          handlePreviousPage
        }
        onNextPage={
          handleNextPage
        }
        onTogglePanel={
          handleTogglePanel
        }
      />

      <div className={workspaceClassName}>
        <ReaderDocumentStage
          ref={stageRef}
          page={loadedPdfPage}
          secondaryPage={
            loadedSecondaryPdfPage
          }
          continuousPages={
            loadedContinuousPdfPages
          }
          searchOccurrences={
            pdfTextSearchOccurrences
          }
          activeSearchOccurrence={
            activePdfTextSearchOccurrence
          }
          annotations={
            annotations
          }
          pageDisplayMode={
            configuredPageDisplayMode
          }
          readingFlowMode={
            configuredReadingFlowMode
          }
          scale={pageScale}
          rotation={pageRotation}
          isPageLoading={
            isPageLoading
          }
          isSecondaryPageLoading={
            isSecondaryPageLoading
          }
          isContinuousPagesLoading={
            isContinuousPagesLoading
          }
          pageLoadError={
            pageLoadErrorMessage
          }
          secondaryPageLoadError={
            secondaryPageLoadErrorMessage
          }
          continuousPagesLoadError={
            continuousPagesLoadErrorMessage
          }
          continuousHasPreviousPages={
            continuousHasPreviousPages
          }
          continuousHasNextPages={
            continuousHasNextPages
          }
        />

        {panelOpen && (
          <ReaderSidePanel
            currentPage={currentPage}
            totalPages={totalPages}
            activeSection={
              activePanelSection
            }
            thumbnailsContent={
              <ReaderThumbnails
                pages={loadedThumbnailPdfPages}
                currentPage={currentPage}
                totalPages={totalPages}
                rotation={pageRotation}
                isLoading={thumbnailPagesLoadStatus === AsyncStatus.LOADING}
                hasPreviousPages={thumbnailHasPreviousPages}
                hasNextPages={thumbnailHasNextPages}
                errorMessage={thumbnailPagesLoadErrorMessage}
                onOpenPage={handleOpenThumbnailPage}
                onLoadPrevious={loadPreviousThumbnailPdfPages}
                onLoadNext={loadNextThumbnailPdfPages}
                onDismissError={clearThumbnailPagesLoadError}
              />
            }
            outlineContent={
              <ReaderOutline
                items={
                  pdfOutlineItems
                }
                currentPage={
                  currentPage
                }
                isLoading={
                  isPdfOutlineLoading
                }
                errorMessage={
                  pdfOutlineErrorMessage
                }
                onOpenItem={
                  handleOpenPdfOutlineItem
                }
                onDismissError={
                  clearPdfOutlineError
                }
              />
            }
            searchContent={
              <ReaderTextSearch
                searchQuery={
                  pdfTextSearchQuery
                }
                result={
                  pdfTextSearchResult
                }
                activeOccurrence={
                  activePdfTextSearchOccurrence
                }
                isSearching={
                  isPdfTextSearching
                }
                completedPages={
                  pdfTextSearchCompletedPages
                }
                totalPages={
                  pdfTextSearchTotalPages
                }
                errorMessage={
                  pdfTextSearchErrorMessage
                }
                focusRequestId={
                  searchFocusRequestId
                }
                onSearch={
                  handleSearchPdfText
                }
                onOpenOccurrence={
                  handleOpenPdfTextSearchOccurrence
                }
                onClear={
                  handleClearPdfTextSearch
                }
                onDismissError={
                  clearPdfTextSearchError
                }
              />
            }
            annotationsContent={
              <ReaderAnnotations
                annotations={
                  annotations
                }
                currentPage={
                  currentPage
                }
                isLoading={
                  areAnnotationsLoading
                }
                isMutating={
                  isAnnotationMutating
                }
                errorMessage={
                  annotationErrorMessage
                }
                onAddNote={
                  handleAddNote
                }
                onOpenAnnotation={
                  handleOpenAnnotation
                }
                onDeleteAnnotation={
                  handleDeleteAnnotation
                }
                onDismissError={
                  clearAnnotationError
                }
              />
            }
            bookmarksContent={
              <ReaderBookmarks
                bookmarks={bookmarks}
                currentPage={
                  currentPage
                }
                isLoading={
                  areBookmarksLoading
                }
                isMutating={
                  isBookmarkMutating
                }
                errorMessage={
                  bookmarkErrorMessage
                }
                onAddCurrentPage={
                  handleAddCurrentPageBookmark
                }
                onOpenBookmark={
                  handleOpenBookmark
                }
                onDeleteBookmark={
                  handleDeleteBookmark
                }
                onDismissError={
                  clearBookmarkError
                }
              />
            }
            onSectionChange={
              handlePanelSectionChange
            }
            onClose={
              handleClosePanel
            }
          />
        )}
      </div>
    </section>
  )
}

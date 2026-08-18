import {
  useId,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'

import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@/components/buttons/Button'
import {
  ReaderPanelSection,
} from '@/models/enums/ReaderPanelSection'

import '@/styles/components/reader-side-panel.css'

export interface ReaderSidePanelProps
  extends HTMLAttributes<HTMLElement> {
  readonly currentPage: number
  readonly totalPages: number

  readonly activeSection:
    ReaderPanelSection

  readonly thumbnailsContent?: ReactNode

  readonly outlineContent?: ReactNode

  readonly searchContent?: ReactNode

  readonly bookmarksContent?: ReactNode

  readonly annotationsContent?: ReactNode

  readonly onSectionChange: (
    section: ReaderPanelSection,
  ) => void

  readonly onClose: () => void
}

type ProgressBarStyle = CSSProperties & {
  readonly '--reader-progress': string
}

interface PanelSectionDefinition {
  readonly section: ReaderPanelSection
  readonly label: string
  readonly content: ReactNode
  readonly icon: ReactNode
}

function CloseIcon() {
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
      <path d="m7 7 10 10" />
      <path d="M17 7 7 17" />
    </svg>
  )
}

function ReadingIcon() {
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

function ThumbnailsIcon() {
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
      <rect
        x="4"
        y="3"
        width="6"
        height="8"
        rx="1"
      />
      <rect
        x="14"
        y="3"
        width="6"
        height="8"
        rx="1"
      />
      <rect
        x="4"
        y="13"
        width="6"
        height="8"
        rx="1"
      />
      <rect
        x="14"
        y="13"
        width="6"
        height="8"
        rx="1"
      />
    </svg>
  )
}

function OutlineIcon() {
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
      <path d="M8 6h12" />
      <path d="M8 12h12" />
      <path d="M8 18h12" />

      <circle
        cx="4"
        cy="6"
        r="1"
      />
      <circle
        cx="4"
        cy="12"
        r="1"
      />
      <circle
        cx="4"
        cy="18"
        r="1"
      />
    </svg>
  )
}

function SearchIcon() {
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
        cx="11"
        cy="11"
        r="6"
      />

      <path d="m16 16 4 4" />
    </svg>
  )
}

function AnnotationsIcon() {
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
      <path d="M5 4h14v13H9l-4 4z" />
      <path d="M9 8h6" />
      <path d="M9 12h4" />
    </svg>
  )
}

function BookmarksIcon() {
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
      <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.75L6 21z" />
    </svg>
  )
}

function createPanelClassName(
  customClassName: string | undefined,
): string {
  const classNames = [
    'reader-page__panel',
  ]

  if (
    customClassName !== undefined &&
    customClassName.trim().length > 0
  ) {
    classNames.push(
      customClassName,
    )
  }

  return classNames.join(' ')
}

function normalizeTotalPages(
  totalPages: number,
): number {
  return Math.max(
    0,
    Math.trunc(totalPages),
  )
}

function normalizeCurrentPage(
  currentPage: number,
  totalPages: number,
): number {
  if (totalPages === 0) {
    return 0
  }

  return Math.min(
    Math.max(
      1,
      Math.trunc(currentPage),
    ),
    totalPages,
  )
}

export function ReaderSidePanel({
  currentPage,
  totalPages,
  activeSection,
  thumbnailsContent,
  outlineContent,
  searchContent,
  bookmarksContent,
  annotationsContent,
  onSectionChange,
  onClose,
  className,
  ...panelProps
}: ReaderSidePanelProps) {
  const progressTitleId = useId()
  const navigationId = useId()

  const normalizedTotalPages =
    normalizeTotalPages(
      totalPages,
    )

  const normalizedCurrentPage =
    normalizeCurrentPage(
      currentPage,
      normalizedTotalPages,
    )

  const progressPercentage =
    normalizedTotalPages > 0
      ? Math.round(
          (
            normalizedCurrentPage /
            normalizedTotalPages
          ) * 100,
        )
      : 0

  const progressBarStyle:
    ProgressBarStyle = {
      '--reader-progress':
        `${progressPercentage}%`,
    }

  const progressDescription =
    normalizedTotalPages > 0
      ? `Página ${normalizedCurrentPage} de ${normalizedTotalPages}`
      : 'Progresso indisponível'

  const sectionDefinitions:
    readonly PanelSectionDefinition[] = [
      {
        section:
          ReaderPanelSection.THUMBNAILS,

        label:
          'Miniaturas',

        content:
          thumbnailsContent,

        icon:
          <ThumbnailsIcon />,
      },

      {
        section:
          ReaderPanelSection.OUTLINE,

        label:
          'Sumário',

        content:
          outlineContent,

        icon:
          <OutlineIcon />,
      },

      {
        section:
          ReaderPanelSection.SEARCH,

        label:
          'Busca',

        content:
          searchContent,

        icon:
          <SearchIcon />,
      },

      {
        section:
          ReaderPanelSection.ANNOTATIONS,

        label:
          'Anotações',

        content:
          annotationsContent,

        icon:
          <AnnotationsIcon />,
      },

      {
        section:
          ReaderPanelSection.BOOKMARKS,

        label:
          'Favoritos',

        content:
          bookmarksContent,

        icon:
          <BookmarksIcon />,
      },
    ]

  const availableSections =
    sectionDefinitions.filter(
      (definition) =>
        definition.content !==
        undefined,
    )

  const activeDefinition =
    availableSections.find(
      (definition) =>
        definition.section ===
        activeSection,
    ) ??
    availableSections[0] ??
    null

  const activeSectionValue =
    activeDefinition?.section ??
    null

  const activeTabId =
    activeSectionValue === null
      ? undefined
      : `${navigationId}-${activeSectionValue}-tab`

  const activePanelId =
    activeSectionValue === null
      ? undefined
      : `${navigationId}-${activeSectionValue}-panel`

  return (
    <aside
      {...panelProps}
      className={
        createPanelClassName(
          className,
        )
      }
      aria-label="Painel lateral do leitor"
    >
      <header className="reader-page__panel-header">
        <div className="reader-side-panel__heading">
          <span
            className="reader-side-panel__heading-icon"
            aria-hidden="true"
          >
            <ReadingIcon />
          </span>

          <div className="reader-side-panel__heading-text">
            <span className="reader-side-panel__eyebrow">
              Documento
            </span>

            <h2 className="reader-page__panel-title">
              Leitura
            </h2>
          </div>
        </div>

        <Button
          variant={
            ButtonVariant.GHOST
          }
          size={
            ButtonSize.SMALL
          }
          iconOnly
          aria-label="Fechar painel lateral"
          title="Fechar painel"
          onClick={onClose}
        >
          <CloseIcon />
        </Button>
      </header>

      <div className="reader-page__panel-content">
        <section
          className="
            reader-side-panel__section
            reader-side-panel__section--progress
          "
          aria-labelledby={
            progressTitleId
          }
        >
          <div className="reader-side-panel__progress-header">
            <div>
              <span className="reader-side-panel__section-eyebrow">
                Sessão atual
              </span>

              <h3
                id={progressTitleId}
                className="reader-side-panel__section-title"
              >
                Progresso
              </h3>
            </div>

            <strong className="reader-side-panel__progress-value">
              {progressPercentage}%
            </strong>
          </div>

          <p
            className="reader-side-panel__progress-page"
            aria-live="polite"
          >
            {progressDescription}
          </p>

          <div
            className="reader-side-panel__progress-track"
            role="progressbar"
            aria-label="Progresso da leitura"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={
              progressPercentage
            }
          >
            <span
              className="reader-side-panel__progress-bar"
              style={
                progressBarStyle
              }
            />
          </div>
        </section>

        {availableSections.length > 0 && (
          <>
            <div
              className="reader-side-panel__navigation"
              role="tablist"
              aria-label="Seções do painel lateral"
            >
              {availableSections.map(
                (definition) => {
                  const isActive =
                    definition.section ===
                    activeSectionValue

                  const tabId =
                    `${navigationId}-${definition.section}-tab`

                  const panelId =
                    `${navigationId}-${definition.section}-panel`

                  return (
                    <button
                      key={
                        definition.section
                      }
                      id={tabId}
                      type="button"
                      className={
                        [
                          'reader-side-panel__navigation-button',

                          isActive
                            ? 'reader-side-panel__navigation-button--active'
                            : '',
                        ]
                          .filter(
                            (
                              navigationClassName,
                            ) =>
                              navigationClassName.length >
                              0,
                          )
                          .join(' ')
                      }
                      role="tab"
                      aria-selected={
                        isActive
                      }
                      aria-controls={
                        panelId
                      }
                      title={
                        definition.label
                      }
                      onClick={() => {
                        onSectionChange(
                          definition.section,
                        )
                      }}
                    >
                      <span
                        className="reader-side-panel__navigation-icon"
                        aria-hidden="true"
                      >
                        {
                          definition.icon
                        }
                      </span>

                      <span className="reader-side-panel__navigation-label">
                        {
                          definition.label
                        }
                      </span>
                    </button>
                  )
                },
              )}
            </div>

            {activeDefinition !== null && (
              <div
                id={activePanelId}
                className="
                  reader-side-panel__section
                  reader-side-panel__section--content
                  reader-side-panel__active-content
                "
                role="tabpanel"
                aria-labelledby={
                  activeTabId
                }
                data-reader-section={
                  activeDefinition.section
                }
              >
                {
                  activeDefinition.content
                }
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
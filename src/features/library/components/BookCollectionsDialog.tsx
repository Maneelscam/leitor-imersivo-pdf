import {
  FeedbackMessage,
  FeedbackMessageVariant,
} from '@/components/feedback/FeedbackMessage'
import {
  LoadingIndicator,
  LoadingIndicatorSize,
} from '@/components/feedback/LoadingIndicator'
import {
  ConfirmDialog,
} from '@/components/overlays/ConfirmDialog'
import type {
  CollectionSummary,
} from '@/models/dtos/CollectionSummary'
import type {
  LibraryBookItem,
} from '@/models/dtos/LibraryBookItem'
import type {
  CollectionId,
} from '@/models/value-objects/CollectionId'

export interface BookCollectionsDialogProps {
  readonly item:
    LibraryBookItem

  readonly summaries:
    readonly CollectionSummary[]

  readonly assignedCollectionIds:
    readonly CollectionId[]

  readonly loading:
    boolean

  readonly mutating:
    boolean

  readonly errorMessage:
    string | null

  readonly onToggle: (
    collectionId: CollectionId,
    shouldBeAssigned: boolean,
  ) => void | Promise<void>

  readonly onClose:
    () => void
}

function FolderIcon() {
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
      <path d="M3.5 6.5h6l2 2h9v10.5a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19z" />
      <path d="M3.5 9h17" />
    </svg>
  )
}

export function BookCollectionsDialog({
  item,
  summaries,
  assignedCollectionIds,
  loading,
  mutating,
  errorMessage,
  onToggle,
  onClose,
}: BookCollectionsDialogProps) {
  const assignedIds =
    new Set(
      assignedCollectionIds,
    )

  return (
    <ConfirmDialog
      open
      className="book-collections-dialog"
      title="Organizar em coleções"
      description={item.book.title}
      confirmLabel="Concluir"
      cancelLabel="Fechar"
      destructive={false}
      isConfirming={mutating}
      icon={<FolderIcon />}
      onConfirm={onClose}
      onCancel={onClose}
    >
      <div className="book-collections-dialog__content">
        {loading ? (
          <div className="book-collections-dialog__loading">
            <LoadingIndicator
              size={
                LoadingIndicatorSize.MEDIUM
              }
              label="Carregando coleções..."
              vertical
            />
          </div>
        ) : summaries.length === 0 ? (
          <div className="book-collections-dialog__empty">
            <strong>
              Nenhuma coleção criada
            </strong>

            <span>
              Crie uma coleção na biblioteca e depois volte para organizar este livro.
            </span>
          </div>
        ) : (
          <div className="book-collections-dialog__list">
            {summaries.map(
              ({
                collection,
                bookCount,
              }) => {
                const checked =
                  assignedIds.has(
                    collection.id,
                  )

                return (
                  <label
                    key={
                      collection.id
                    }
                    className={
                      checked
                        ? 'book-collections-dialog__option book-collections-dialog__option--checked'
                        : 'book-collections-dialog__option'
                    }
                  >
                    <input
                      className="book-collections-dialog__checkbox"
                      type="checkbox"
                      checked={checked}
                      disabled={mutating}
                      onChange={(event) => {
                        void onToggle(
                          collection.id,
                          event.currentTarget.checked,
                        )
                      }}
                    />

                    <span className="book-collections-dialog__option-icon">
                      <FolderIcon />
                    </span>

                    <span className="book-collections-dialog__option-copy">
                      <strong>
                        {collection.name}
                      </strong>

                      <span>
                        {bookCount === 1
                          ? '1 livro'
                          : `${bookCount} livros`}
                      </span>
                    </span>
                  </label>
                )
              },
            )}
          </div>
        )}

        <p className="book-collections-dialog__notice">
          Marcar ou desmarcar uma coleção altera apenas a organização interna da Hwei. O PDF original não é movido nem duplicado.
        </p>

        {errorMessage !== null && (
          <FeedbackMessage
            variant={
              FeedbackMessageVariant.ERROR
            }
            title="Não foi possível atualizar as coleções"
            description={errorMessage}
            compact
          />
        )}
      </div>
    </ConfirmDialog>
  )
}

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
  BookId,
} from '@/models/value-objects/BookId'

export interface CollectionBooksDialogProps {
  readonly summary:
    CollectionSummary

  readonly items:
    readonly LibraryBookItem[]

  readonly assignedBookIds:
    readonly BookId[]

  readonly loading:
    boolean

  readonly mutating:
    boolean

  readonly errorMessage:
    string | null

  readonly onToggle: (
    bookId: BookId,
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

export function CollectionBooksDialog({
  summary,
  items,
  assignedBookIds,
  loading,
  mutating,
  errorMessage,
  onToggle,
  onClose,
}: CollectionBooksDialogProps) {
  const assignedIds =
    new Set(
      assignedBookIds,
    )

  return (
    <ConfirmDialog
      open
      className="collection-books-dialog"
      title="Livros da coleção"
      description={
        summary.collection.name
      }
      confirmLabel="Concluir"
      cancelLabel="Fechar"
      destructive={false}
      isConfirming={mutating}
      icon={<FolderIcon />}
      onConfirm={onClose}
      onCancel={onClose}
    >
      <div className="collection-books-dialog__content">
        {loading ? (
          <div className="collection-books-dialog__loading">
            <LoadingIndicator
              size={
                LoadingIndicatorSize.MEDIUM
              }
              label="Carregando livros..."
              vertical
            />
          </div>
        ) : items.length === 0 ? (
          <div className="collection-books-dialog__empty">
            <strong>
              Sua biblioteca ainda está vazia
            </strong>

            <span>
              Importe um PDF para poder adicioná-lo a esta coleção.
            </span>
          </div>
        ) : (
          <div
            className="collection-books-dialog__list"
            aria-label="Livros disponíveis"
          >
            {items.map(
              (item) => {
                const checked =
                  assignedIds.has(
                    item.book.id,
                  )

                return (
                  <label
                    key={item.book.id}
                    className={
                      checked
                        ? 'collection-books-dialog__option collection-books-dialog__option--checked'
                        : 'collection-books-dialog__option'
                    }
                  >
                    <input
                      className="collection-books-dialog__checkbox"
                      type="checkbox"
                      checked={checked}
                      disabled={mutating}
                      onChange={(event) => {
                        void onToggle(
                          item.book.id,
                          event.currentTarget.checked,
                        )
                      }}
                    />

                    <span className="collection-books-dialog__option-icon">
                      <FolderIcon />
                    </span>

                    <span className="collection-books-dialog__option-copy">
                      <strong>
                        {item.book.title}
                      </strong>

                      <span>
                        {item.book.author ??
                          'Autor não informado'}
                      </span>
                    </span>
                  </label>
                )
              },
            )}
          </div>
        )}

        <p className="collection-books-dialog__notice">
          Marque os livros que devem fazer parte desta coleção. Um mesmo livro pode aparecer em várias coleções e nenhum PDF é movido ou duplicado.
        </p>

        {errorMessage !== null && (
          <FeedbackMessage
            variant={
              FeedbackMessageVariant.ERROR
            }
            title="Não foi possível atualizar a coleção"
            description={errorMessage}
            compact
          />
        )}
      </div>
    </ConfirmDialog>
  )
}

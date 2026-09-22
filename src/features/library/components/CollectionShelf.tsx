import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@/components/buttons/Button'
import type {
  CollectionSummary,
} from '@/models/dtos/CollectionSummary'
import type {
  Collection,
} from '@/models/entities/Collection'
import type {
  CollectionId,
} from '@/models/value-objects/CollectionId'

export interface CollectionShelfProps {
  readonly summaries:
    readonly CollectionSummary[]

  readonly selectedCollectionId:
    CollectionId | null

  readonly loading:
    boolean

  readonly disabled:
    boolean

  readonly onSelect: (
    collectionId: CollectionId,
  ) => void | Promise<void>

  readonly onCreate:
    () => void

  readonly onEdit: (
    collection: Collection,
  ) => void

  readonly onDelete: (
    summary: CollectionSummary,
  ) => void

  readonly onManageBooks: (
    summary: CollectionSummary,
  ) => void
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

function PlusIcon() {
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
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function EditIcon() {
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
      <path d="M4 20h4l11-11-4-4L4 16z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  )
}

function DeleteIcon() {
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
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="m6.5 7 1 14h9l1-14" />
    </svg>
  )
}

function formatBookCount(
  count: number,
): string {
  return count === 1
    ? '1 livro'
    : `${count} livros`
}

export function CollectionShelf({
  summaries,
  selectedCollectionId,
  loading,
  disabled,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
  onManageBooks,
}: CollectionShelfProps) {
  return (
    <section
      className="collection-shelf"
      aria-labelledby="collection-shelf-title"
      aria-busy={loading}
    >
      <div className="collection-shelf__heading">
        <div>
          <span className="collection-shelf__kicker">
            Organização
          </span>

          <h2
            id="collection-shelf-title"
            className="collection-shelf__title"
          >
            Coleções
          </h2>

          <p className="collection-shelf__description">
            Reúna seus livros por tema, projeto ou momento de leitura.
          </p>
        </div>

        <Button
          variant={ButtonVariant.SECONDARY}
          size={ButtonSize.SMALL}
          leadingIcon={<PlusIcon />}
          disabled={disabled}
          onClick={onCreate}
        >
          Nova coleção
        </Button>
      </div>

      {summaries.length === 0 ? (
        <button
          type="button"
          className="collection-shelf__empty"
          disabled={disabled}
          onClick={onCreate}
        >
          <span className="collection-shelf__empty-icon">
            <FolderIcon />
          </span>

          <span className="collection-shelf__empty-copy">
            <strong>
              Crie sua primeira coleção
            </strong>

            <span>
              Organize o acervo sem mover ou duplicar nenhum PDF.
            </span>
          </span>

          <span className="collection-shelf__empty-action">
            Criar coleção
          </span>
        </button>
      ) : (
        <div
          className="collection-shelf__rail"
          role="list"
          aria-label="Coleções da biblioteca"
        >
          {summaries.map(
            (summary) => {
              const {
                collection,
                bookCount,
              } = summary

              const selected =
                selectedCollectionId ===
                collection.id

              return (
                <article
                  key={collection.id}
                  className={
                    selected
                      ? 'collection-card collection-card--selected'
                      : 'collection-card'
                  }
                  role="listitem"
                >
                  <button
                    type="button"
                    className="collection-card__main"
                    aria-pressed={selected}
                    disabled={disabled}
                    onClick={() => {
                      void onSelect(
                        collection.id,
                      )
                    }}
                  >
                    <span className="collection-card__icon">
                      <FolderIcon />
                    </span>

                    <span className="collection-card__content">
                      <strong className="collection-card__name">
                        {collection.name}
                      </strong>

                      <span className="collection-card__count">
                        {formatBookCount(
                          bookCount,
                        )}
                      </span>

                      {collection.description !== null && (
                        <span className="collection-card__description">
                          {collection.description}
                        </span>
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="collection-card__books-action"
                    disabled={disabled}
                    onClick={() => {
                      onManageBooks(
                        summary,
                      )
                    }}
                  >
                    <FolderIcon />
                    <span>
                      Adicionar / remover livros
                    </span>
                  </button>

                  <div className="collection-card__actions">
                    <Button
                      variant={ButtonVariant.GHOST}
                      size={ButtonSize.SMALL}
                      iconOnly
                      disabled={disabled}
                      aria-label={`Editar coleção ${collection.name}`}
                      title={`Editar coleção ${collection.name}`}
                      onClick={() => {
                        onEdit(
                          collection,
                        )
                      }}
                    >
                      <EditIcon />
                    </Button>

                    <Button
                      variant={ButtonVariant.GHOST}
                      size={ButtonSize.SMALL}
                      iconOnly
                      disabled={disabled}
                      aria-label={`Excluir coleção ${collection.name}`}
                      title={`Excluir coleção ${collection.name}`}
                      onClick={() => {
                        onDelete(
                          summary,
                        )
                      }}
                    >
                      <DeleteIcon />
                    </Button>
                  </div>
                </article>
              )
            },
          )}
        </div>
      )}
    </section>
  )
}

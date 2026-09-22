import {
  useId,
  useState,
  type ChangeEvent,
} from 'react'

import {
  FeedbackMessage,
  FeedbackMessageVariant,
} from '@/components/feedback/FeedbackMessage'
import {
  ConfirmDialog,
} from '@/components/overlays/ConfirmDialog'
import type {
  Collection,
} from '@/models/entities/Collection'

export interface CollectionEditorDialogProps {
  readonly collection:
    Collection | null

  readonly isSaving:
    boolean

  readonly errorMessage:
    string | null

  readonly onSave: (
    name: string,
    description: string | null,
  ) => void | Promise<void>

  readonly onCancel:
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

export function CollectionEditorDialog({
  collection,
  isSaving,
  errorMessage,
  onSave,
  onCancel,
}: CollectionEditorDialogProps) {
  const nameInputId =
    useId()

  const descriptionInputId =
    useId()

  const [name, setName] =
    useState(
      collection?.name ?? '',
    )

  const [
    description,
    setDescription,
  ] = useState(
    collection?.description ?? '',
  )

  const [
    validationAttempted,
    setValidationAttempted,
  ] = useState(false)

  const nameIsInvalid =
    name.trim().length === 0

  const handleNameChange = (
    event:
      ChangeEvent<HTMLInputElement>,
  ) => {
    setName(
      event.currentTarget.value,
    )
  }

  const handleDescriptionChange = (
    event:
      ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setDescription(
      event.currentTarget.value,
    )
  }

  const handleSave = async () => {
    setValidationAttempted(true)

    if (nameIsInvalid) {
      return
    }

    await onSave(
      name,
      description.trim().length === 0
        ? null
        : description,
    )
  }

  const isEditing =
    collection !== null

  return (
    <ConfirmDialog
      open
      className="collection-editor-dialog"
      title={
        isEditing
          ? 'Editar coleção'
          : 'Nova coleção'
      }
      description={
        isEditing
          ? 'Ajuste o nome ou a descrição sem alterar os livros da coleção.'
          : 'Crie uma estante pessoal para organizar seus PDFs.'
      }
      confirmLabel={
        isEditing
          ? 'Salvar alterações'
          : 'Criar coleção'
      }
      cancelLabel="Cancelar"
      destructive={false}
      isConfirming={isSaving}
      icon={<FolderIcon />}
      onConfirm={handleSave}
      onCancel={onCancel}
    >
      <div className="collection-editor-dialog__content">
        <div className="collection-editor-dialog__field">
          <label
            className="collection-editor-dialog__label"
            htmlFor={nameInputId}
          >
            Nome
          </label>

          <input
            id={nameInputId}
            className="collection-editor-dialog__input"
            type="text"
            value={name}
            maxLength={80}
            disabled={isSaving}
            placeholder="Ex.: Estudos, Filosofia, Trabalho"
            aria-invalid={
              validationAttempted &&
              nameIsInvalid
            }
            autoFocus
            onChange={handleNameChange}
          />

          <div className="collection-editor-dialog__field-meta">
            {validationAttempted &&
            nameIsInvalid ? (
              <span
                className="collection-editor-dialog__field-error"
                role="alert"
              >
                Informe um nome para a coleção.
              </span>
            ) : (
              <span>
                Até 80 caracteres.
              </span>
            )}

            <span>
              {name.length}/80
            </span>
          </div>
        </div>

        <div className="collection-editor-dialog__field">
          <label
            className="collection-editor-dialog__label"
            htmlFor={descriptionInputId}
          >
            Descrição
          </label>

          <textarea
            id={descriptionInputId}
            className="collection-editor-dialog__textarea"
            value={description}
            maxLength={240}
            rows={4}
            disabled={isSaving}
            placeholder="Opcional. Uma breve nota sobre o que você reúne aqui."
            onChange={
              handleDescriptionChange
            }
          />

          <div className="collection-editor-dialog__field-meta">
            <span>
              A descrição é opcional.
            </span>

            <span>
              {description.length}/240
            </span>
          </div>
        </div>

        <p className="collection-editor-dialog__notice">
          Coleções guardam apenas vínculos de organização. Seus PDFs permanecem intactos e podem aparecer em várias coleções ao mesmo tempo.
        </p>

        {errorMessage !== null && (
          <FeedbackMessage
            variant={
              FeedbackMessageVariant.ERROR
            }
            title={
              isEditing
                ? 'Não foi possível salvar'
                : 'Não foi possível criar'
            }
            description={errorMessage}
            compact
          />
        )}
      </div>
    </ConfirmDialog>
  )
}

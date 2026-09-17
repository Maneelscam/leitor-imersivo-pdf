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
  LibraryBookItem,
} from '@/models/dtos/LibraryBookItem'

import '@/styles/components/edit-book-metadata-dialog.css'

export interface EditBookMetadataDialogProps {
  readonly item:
    LibraryBookItem

  readonly isSaving:
    boolean

  readonly errorMessage:
    string | null

  readonly onSave: (
    title: string,
    author: string | null,
  ) => void | Promise<void>

  readonly onCancel:
    () => void
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

export function EditBookMetadataDialog({
  item,
  isSaving,
  errorMessage,
  onSave,
  onCancel,
}: EditBookMetadataDialogProps) {
  const titleInputId =
    useId()

  const authorInputId =
    useId()

  const [
    title,
    setTitle,
  ] = useState(
    item.book.title,
  )

  const [
    author,
    setAuthor,
  ] = useState(
    item.book.author ?? '',
  )

  const [
    validationAttempted,
    setValidationAttempted,
  ] = useState(false)

  const titleIsInvalid =
    title.trim().length === 0

  const handleTitleChange = (
    event:
      ChangeEvent<HTMLInputElement>,
  ) => {
    setTitle(
      event.currentTarget.value,
    )
  }

  const handleAuthorChange = (
    event:
      ChangeEvent<HTMLInputElement>,
  ) => {
    setAuthor(
      event.currentTarget.value,
    )
  }

  const handleSave = async () => {
    setValidationAttempted(true)

    if (titleIsInvalid) {
      return
    }

    await onSave(
      title,
      author.trim().length === 0
        ? null
        : author,
    )
  }

  return (
    <ConfirmDialog
      open
      className="edit-book-metadata-dialog"
      title="Editar informações"
      description="Personalize como este PDF aparece na sua biblioteca."
      confirmLabel="Salvar alterações"
      cancelLabel="Cancelar"
      destructive={false}
      isConfirming={isSaving}
      icon={<EditIcon />}
      onConfirm={handleSave}
      onCancel={onCancel}
    >
      <div className="edit-book-metadata-dialog__content">
        <div className="edit-book-metadata-dialog__field">
          <label
            className="edit-book-metadata-dialog__label"
            htmlFor={titleInputId}
          >
            Título
          </label>

          <input
            id={titleInputId}
            className="edit-book-metadata-dialog__input"
            type="text"
            value={title}
            disabled={isSaving}
            aria-invalid={
              validationAttempted &&
              titleIsInvalid
            }
            onChange={
              handleTitleChange
            }
          />

          {validationAttempted &&
            titleIsInvalid && (
            <span
              className="edit-book-metadata-dialog__field-error"
              role="alert"
            >
              Informe um título para o livro.
            </span>
          )}
        </div>

        <div className="edit-book-metadata-dialog__field">
          <label
            className="edit-book-metadata-dialog__label"
            htmlFor={authorInputId}
          >
            Autor
          </label>

          <input
            id={authorInputId}
            className="edit-book-metadata-dialog__input"
            type="text"
            value={author}
            disabled={isSaving}
            placeholder="Autor não informado"
            onChange={
              handleAuthorChange
            }
          />

          <span className="edit-book-metadata-dialog__hint">
            O autor pode ficar em branco.
          </span>
        </div>

        <div className="edit-book-metadata-dialog__original-file">
          <span className="edit-book-metadata-dialog__original-file-label">
            Arquivo original
          </span>

          <span className="edit-book-metadata-dialog__original-file-name">
            {item.book.originalFileName}
          </span>
        </div>

        <p className="edit-book-metadata-dialog__notice">
          Esta alteração modifica apenas as informações exibidas pelo aplicativo. O arquivo PDF original permanece intacto.
        </p>

        {errorMessage !== null && (
          <FeedbackMessage
            variant={
              FeedbackMessageVariant.ERROR
            }
            title="Não foi possível salvar"
            description={
              errorMessage
            }
            compact
          />
        )}
      </div>
    </ConfirmDialog>
  )
}

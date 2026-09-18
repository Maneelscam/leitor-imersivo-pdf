import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from 'react'

import '@/styles/components/app-error-boundary.css'

export interface AppErrorBoundaryProps {
  readonly children: ReactNode
}

interface AppErrorBoundaryState {
  readonly hasError: boolean
}

const INITIAL_STATE:
  AppErrorBoundaryState = {
    hasError: false,
  }

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state:
    AppErrorBoundaryState =
      INITIAL_STATE

  static getDerivedStateFromError():
    AppErrorBoundaryState {
    return {
      hasError: true,
    }
  }

  componentDidCatch(
    error: Error,
    errorInfo: ErrorInfo,
  ): void {
    if (import.meta.env.DEV) {
      console.error(
        'Erro não tratado na interface.',
        error,
        errorInfo,
      )
    }
  }

  private readonly handleReload =
    (): void => {
      window.location.reload()
    }

  private readonly handleReturnToLibrary =
    (): void => {
      window.location.hash = '#/'
      window.location.reload()
    }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main
        className="app-error-boundary"
        role="alert"
      >
        <section className="app-error-boundary__card">
          <div
            className="app-error-boundary__icon"
            aria-hidden="true"
          >
            !
          </div>

          <div className="app-error-boundary__content">
            <p className="app-error-boundary__eyebrow">
              Leitor Imersivo
            </p>

            <h1 className="app-error-boundary__title">
              Algo deu errado
            </h1>

            <p className="app-error-boundary__description">
              O aplicativo encontrou um erro inesperado.
              Seus PDFs e dados locais não são alterados por esta tela.
            </p>

            <div className="app-error-boundary__actions">
              <button
                type="button"
                className="app-error-boundary__primary"
                onClick={this.handleReload}
              >
                Tentar novamente
              </button>

              <button
                type="button"
                className="app-error-boundary__secondary"
                onClick={
                  this.handleReturnToLibrary
                }
              >
                Voltar para a biblioteca
              </button>
            </div>
          </div>
        </section>
      </main>
    )
  }
}

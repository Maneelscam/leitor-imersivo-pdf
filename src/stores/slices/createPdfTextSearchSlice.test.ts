import type {
  PDFDocumentProxy,
} from 'pdfjs-dist'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  applicationContainer,
} from '@/app/providers/applicationContainer'
import type {
  PdfTextSearchResult,
} from '@/models/dtos/PdfTextSearchResult'
import {
  AsyncStatus,
} from '@/models/enums/AsyncStatus'
import type {
  LoadedPdfDocument,
} from '@/services/pdf/PdfDocumentService'
import type {
  PdfTextSearchOptions,
} from '@/services/pdf/PdfTextSearchService'
import {
  useAppStore,
} from '@/stores/useAppStore'

interface TestLoadedPdfDocument {
  readonly loadedPdfDocument:
    LoadedPdfDocument

  closeDocument(): void
}

function createLoadedPdfDocument(
  numPages = 10,
): TestLoadedPdfDocument {
  let isClosed = false

  const document = {
    numPages,
  } as unknown as PDFDocumentProxy

  const loadedPdfDocument:
    LoadedPdfDocument = {
      document,

      get isClosed() {
        return isClosed
      },

      close:
        vi.fn(
          async () => {
            isClosed = true
          },
        ),
  }

  return {
    loadedPdfDocument,

    closeDocument: () => {
      isClosed = true
    },
  }
}

function createSearchResult({
  query = 'internet',
  totalPagesSearched = 10,
  totalOccurrences = 0,
  pagesWithOccurrences = 0,
}: {
  readonly query?: string
  readonly totalPagesSearched?: number
  readonly totalOccurrences?: number
  readonly pagesWithOccurrences?: number
} = {}): PdfTextSearchResult {
  return {
    query,

    totalPagesSearched,

    totalOccurrences,

    pagesWithOccurrences,

    pageResults: [],
  }
}

function resetSearchState(): void {
  useAppStore.setState({
    loadedPdfDocument:
      null,

    pdfTextSearchQuery:
      '',

    pdfTextSearchResult:
      null,

    pdfTextSearchStatus:
      AsyncStatus.IDLE,

    pdfTextSearchCompletedPages:
      0,

    pdfTextSearchTotalPages:
      0,

    pdfTextSearchErrorMessage:
      null,
  })
}

describe(
  'createPdfTextSearchSlice',
  () => {
    beforeEach(
      () => {
        resetSearchState()
      },
    )

    afterEach(
      () => {
        vi.restoreAllMocks()

        resetSearchState()
      },
    )

    it(
      'informa erro ao pesquisar sem documento PDF aberto',
      async () => {
        const searchSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .searchPdfText,
            'execute',
          )

        await useAppStore
          .getState()
          .searchPdfText(
            '  internet  ',
          )

        const state =
          useAppStore.getState()

        expect(
          state.pdfTextSearchQuery,
        ).toBe(
          'internet',
        )

        expect(
          state.pdfTextSearchResult,
        ).toBeNull()

        expect(
          state.pdfTextSearchStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )

        expect(
          state.pdfTextSearchCompletedPages,
        ).toBe(
          0,
        )

        expect(
          state.pdfTextSearchTotalPages,
        ).toBe(
          0,
        )

        expect(
          state.pdfTextSearchErrorMessage,
        ).toBe(
          'Nenhum documento PDF está aberto para realizar a pesquisa.',
        )

        expect(
          searchSpy,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'informa erro ao pesquisar em documento já fechado',
      async () => {
        const {
          loadedPdfDocument,
          closeDocument,
        } =
          createLoadedPdfDocument()

        closeDocument()

        const searchSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .searchPdfText,
            'execute',
          )

        useAppStore.setState({
          loadedPdfDocument,
        })

        await useAppStore
          .getState()
          .searchPdfText(
            '  conexão  ',
          )

        const state =
          useAppStore.getState()

        expect(
          state.pdfTextSearchQuery,
        ).toBe(
          'conexão',
        )

        expect(
          state.pdfTextSearchStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )

        expect(
          state.pdfTextSearchErrorMessage,
        ).toBe(
          'Nenhum documento PDF está aberto para realizar a pesquisa.',
        )

        expect(
          searchSpy,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'normaliza a consulta e pesquisa no documento aberto',
      async () => {
        const {
          loadedPdfDocument,
        } =
          createLoadedPdfDocument(
            12,
          )

        const result =
          createSearchResult({
            query:
              'internet',

            totalPagesSearched:
              12,

            totalOccurrences:
              3,

            pagesWithOccurrences:
              2,
          })

        const searchSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .searchPdfText,
            'execute',
          )
            .mockResolvedValue(
              result,
            )

        useAppStore.setState({
          loadedPdfDocument,
        })

        await useAppStore
          .getState()
          .searchPdfText(
            '   internet   ',
          )

        const state =
          useAppStore.getState()

        expect(
          searchSpy,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          searchSpy,
        ).toHaveBeenCalledWith(
          loadedPdfDocument.document,
          'internet',
          expect.objectContaining({
            onProgress:
              expect.any(Function),
          }),
        )

        expect(
          state.pdfTextSearchQuery,
        ).toBe(
          'internet',
        )

        expect(
          state.pdfTextSearchResult,
        ).toEqual(
          result,
        )

        expect(
          state.pdfTextSearchStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )

        expect(
          state.pdfTextSearchCompletedPages,
        ).toBe(
          12,
        )

        expect(
          state.pdfTextSearchTotalPages,
        ).toBe(
          12,
        )

        expect(
          state.pdfTextSearchErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'inicia a pesquisa com o total de páginas do documento',
      async () => {
        const {
          loadedPdfDocument,
        } =
          createLoadedPdfDocument(
            25,
          )

        let resolveSearch:
          (
            result:
              PdfTextSearchResult,
          ) => void =
          () => undefined

        const pendingSearch =
          new Promise<
            PdfTextSearchResult
          >(
            (resolve) => {
              resolveSearch =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .searchPdfText,
          'execute',
        )
          .mockReturnValue(
            pendingSearch,
          )

        useAppStore.setState({
          loadedPdfDocument,
        })

        const searchPromise =
          useAppStore
            .getState()
            .searchPdfText(
              'velocidade',
            )

        const loadingState =
          useAppStore.getState()

        expect(
          loadingState.pdfTextSearchQuery,
        ).toBe(
          'velocidade',
        )

        expect(
          loadingState.pdfTextSearchResult,
        ).toBeNull()

        expect(
          loadingState.pdfTextSearchStatus,
        ).toBe(
          AsyncStatus.LOADING,
        )

        expect(
          loadingState.pdfTextSearchCompletedPages,
        ).toBe(
          0,
        )

        expect(
          loadingState.pdfTextSearchTotalPages,
        ).toBe(
          25,
        )

        expect(
          loadingState.pdfTextSearchErrorMessage,
        ).toBeNull()

        resolveSearch(
          createSearchResult({
            query:
              'velocidade',

            totalPagesSearched:
              25,
          }),
        )

        await searchPromise
      },
    )

    it(
      'atualiza o progresso durante a pesquisa',
      async () => {
        const {
          loadedPdfDocument,
        } =
          createLoadedPdfDocument(
            8,
          )

        let resolveSearch:
          (
            result:
              PdfTextSearchResult,
          ) => void =
          () => undefined

        const pendingSearch =
          new Promise<
            PdfTextSearchResult
          >(
            (resolve) => {
              resolveSearch =
                resolve
            },
          )

        const searchSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .searchPdfText,
            'execute',
          )
            .mockReturnValue(
              pendingSearch,
            )

        useAppStore.setState({
          loadedPdfDocument,
        })

        const searchPromise =
          useAppStore
            .getState()
            .searchPdfText(
              'fibra',
            )

        const options =
          searchSpy.mock.calls[0]?.[2] as
            | PdfTextSearchOptions
            | undefined

        const onProgress =
          options?.onProgress

        if (onProgress === undefined) {
          throw new Error(
            'O callback de progresso não foi fornecido.',
          )
        }

        onProgress({
          completedPages:
            3,

          totalPages:
            8,
        })

        expect(
          useAppStore
            .getState()
            .pdfTextSearchCompletedPages,
        ).toBe(
          3,
        )

        expect(
          useAppStore
            .getState()
            .pdfTextSearchTotalPages,
        ).toBe(
          8,
        )

        onProgress({
          completedPages:
            6,

          totalPages:
            8,
        })

        expect(
          useAppStore
            .getState()
            .pdfTextSearchCompletedPages,
        ).toBe(
          6,
        )

        resolveSearch(
          createSearchResult({
            query:
              'fibra',

            totalPagesSearched:
              8,
          }),
        )

        await searchPromise
      },
    )

    it(
      'registra erro quando a pesquisa falha',
      async () => {
        const {
          loadedPdfDocument,
        } =
          createLoadedPdfDocument(
            10,
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .searchPdfText,
          'execute',
        )
          .mockRejectedValue(
            new Error(
              'Falha controlada na pesquisa.',
            ),
          )

        useAppStore.setState({
          loadedPdfDocument,
        })

        await useAppStore
          .getState()
          .searchPdfText(
            'cliente',
          )

        const state =
          useAppStore.getState()

        expect(
          state.pdfTextSearchResult,
        ).toBeNull()

        expect(
          state.pdfTextSearchStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )

        expect(
          state.pdfTextSearchErrorMessage,
        ).toBe(
          'Falha controlada na pesquisa.',
        )
      },
    )

    it(
      'ignora o resultado de uma pesquisa anterior quando uma nova pesquisa é iniciada',
      async () => {
        const {
          loadedPdfDocument,
        } =
          createLoadedPdfDocument(
            10,
          )

        let resolveFirstSearch:
          (
            result:
              PdfTextSearchResult,
          ) => void =
          () => undefined

        let resolveSecondSearch:
          (
            result:
              PdfTextSearchResult,
          ) => void =
          () => undefined

        const firstPendingSearch =
          new Promise<
            PdfTextSearchResult
          >(
            (resolve) => {
              resolveFirstSearch =
                resolve
            },
          )

        const secondPendingSearch =
          new Promise<
            PdfTextSearchResult
          >(
            (resolve) => {
              resolveSecondSearch =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .searchPdfText,
          'execute',
        )
          .mockReturnValueOnce(
            firstPendingSearch,
          )
          .mockReturnValueOnce(
            secondPendingSearch,
          )

        useAppStore.setState({
          loadedPdfDocument,
        })

        const firstSearchPromise =
          useAppStore
            .getState()
            .searchPdfText(
              'primeira',
            )

        const secondSearchPromise =
          useAppStore
            .getState()
            .searchPdfText(
              'segunda',
            )

        const secondResult =
          createSearchResult({
            query:
              'segunda',

            totalPagesSearched:
              10,

            totalOccurrences:
              2,

            pagesWithOccurrences:
              1,
          })

        resolveSecondSearch(
          secondResult,
        )

        await secondSearchPromise

        expect(
          useAppStore
            .getState()
            .pdfTextSearchResult,
        ).toEqual(
          secondResult,
        )

        resolveFirstSearch(
          createSearchResult({
            query:
              'primeira',

            totalPagesSearched:
              10,

            totalOccurrences:
              99,

            pagesWithOccurrences:
              10,
          }),
        )

        await firstSearchPromise

        const state =
          useAppStore.getState()

        expect(
          state.pdfTextSearchQuery,
        ).toBe(
          'segunda',
        )

        expect(
          state.pdfTextSearchResult,
        ).toEqual(
          secondResult,
        )
      },
    )

    it(
      'ignora progresso pertencente a uma pesquisa anterior',
      async () => {
        const {
          loadedPdfDocument,
        } =
          createLoadedPdfDocument(
            10,
          )

        const pendingSearch =
          new Promise<
            PdfTextSearchResult
          >(
            () => undefined,
          )

        const searchSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .searchPdfText,
            'execute',
          )
            .mockReturnValue(
              pendingSearch,
            )

        useAppStore.setState({
          loadedPdfDocument,
        })

        void useAppStore
          .getState()
          .searchPdfText(
            'primeira',
          )

        const firstOptions =
          searchSpy.mock.calls[0]?.[2] as
            | PdfTextSearchOptions
            | undefined

        const firstProgress =
          firstOptions?.onProgress

        if (
          firstProgress ===
          undefined
        ) {
          throw new Error(
            'O callback de progresso da primeira pesquisa não foi fornecido.',
          )
        }

        void useAppStore
          .getState()
          .searchPdfText(
            'segunda',
          )

        firstProgress({
          completedPages:
            9,

          totalPages:
            10,
        })

        expect(
          useAppStore
            .getState()
            .pdfTextSearchCompletedPages,
        ).toBe(
          0,
        )
      },
    )

    it(
      'clearPdfTextSearch limpa o estado e invalida uma pesquisa pendente',
      async () => {
        const {
          loadedPdfDocument,
        } =
          createLoadedPdfDocument(
            6,
          )

        let resolveSearch:
          (
            result:
              PdfTextSearchResult,
          ) => void =
          () => undefined

        const pendingSearch =
          new Promise<
            PdfTextSearchResult
          >(
            (resolve) => {
              resolveSearch =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .searchPdfText,
          'execute',
        )
          .mockReturnValue(
            pendingSearch,
          )

        useAppStore.setState({
          loadedPdfDocument,
        })

        const searchPromise =
          useAppStore
            .getState()
            .searchPdfText(
              'teste',
            )

        useAppStore
          .getState()
          .clearPdfTextSearch()

        let state =
          useAppStore.getState()

        expect(
          state.pdfTextSearchQuery,
        ).toBe(
          '',
        )

        expect(
          state.pdfTextSearchResult,
        ).toBeNull()

        expect(
          state.pdfTextSearchStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )

        expect(
          state.pdfTextSearchCompletedPages,
        ).toBe(
          0,
        )

        expect(
          state.pdfTextSearchTotalPages,
        ).toBe(
          0,
        )

        expect(
          state.pdfTextSearchErrorMessage,
        ).toBeNull()

        resolveSearch(
          createSearchResult({
            query:
              'teste',

            totalPagesSearched:
              6,

            totalOccurrences:
              20,

            pagesWithOccurrences:
              6,
          }),
        )

        await searchPromise

        state =
          useAppStore.getState()

        expect(
          state.pdfTextSearchQuery,
        ).toBe(
          '',
        )

        expect(
          state.pdfTextSearchResult,
        ).toBeNull()

        expect(
          state.pdfTextSearchStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )
      },
    )

    it(
      'ignora resultado quando outro documento é aberto durante a pesquisa',
      async () => {
        const firstDocument =
          createLoadedPdfDocument(
            10,
          )

        const secondDocument =
          createLoadedPdfDocument(
            4,
          )

        let resolveSearch:
          (
            result:
              PdfTextSearchResult,
          ) => void =
          () => undefined

        const pendingSearch =
          new Promise<
            PdfTextSearchResult
          >(
            (resolve) => {
              resolveSearch =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .searchPdfText,
          'execute',
        )
          .mockReturnValue(
            pendingSearch,
          )

        useAppStore.setState({
          loadedPdfDocument:
            firstDocument
              .loadedPdfDocument,
        })

        const searchPromise =
          useAppStore
            .getState()
            .searchPdfText(
              'documento antigo',
            )

        const currentResult =
          createSearchResult({
            query:
              'documento atual',

            totalPagesSearched:
              4,

            totalOccurrences:
              1,

            pagesWithOccurrences:
              1,
          })

        useAppStore.setState({
          loadedPdfDocument:
            secondDocument
              .loadedPdfDocument,

          pdfTextSearchQuery:
            'documento atual',

          pdfTextSearchResult:
            currentResult,

          pdfTextSearchStatus:
            AsyncStatus.SUCCESS,

          pdfTextSearchCompletedPages:
            4,

          pdfTextSearchTotalPages:
            4,
        })

        resolveSearch(
          createSearchResult({
            query:
              'documento antigo',

            totalPagesSearched:
              10,

            totalOccurrences:
              50,

            pagesWithOccurrences:
              10,
          }),
        )

        await searchPromise

        const state =
          useAppStore.getState()

        expect(
          state.loadedPdfDocument,
        ).toBe(
          secondDocument
            .loadedPdfDocument,
        )

        expect(
          state.pdfTextSearchQuery,
        ).toBe(
          'documento atual',
        )

        expect(
          state.pdfTextSearchResult,
        ).toEqual(
          currentResult,
        )
      },
    )

    it(
      'ignora resultado quando o documento é fechado durante a pesquisa',
      async () => {
        const {
          loadedPdfDocument,
          closeDocument,
        } =
          createLoadedPdfDocument(
            7,
          )

        let resolveSearch:
          (
            result:
              PdfTextSearchResult,
          ) => void =
          () => undefined

        const pendingSearch =
          new Promise<
            PdfTextSearchResult
          >(
            (resolve) => {
              resolveSearch =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .searchPdfText,
          'execute',
        )
          .mockReturnValue(
            pendingSearch,
          )

        useAppStore.setState({
          loadedPdfDocument,
        })

        const searchPromise =
          useAppStore
            .getState()
            .searchPdfText(
              'fechamento',
            )

        closeDocument()

        useAppStore.setState({
          pdfTextSearchQuery:
            '',

          pdfTextSearchResult:
            null,

          pdfTextSearchStatus:
            AsyncStatus.IDLE,

          pdfTextSearchCompletedPages:
            0,

          pdfTextSearchTotalPages:
            0,

          pdfTextSearchErrorMessage:
            null,
        })

        resolveSearch(
          createSearchResult({
            query:
              'fechamento',

            totalPagesSearched:
              7,

            totalOccurrences:
              12,

            pagesWithOccurrences:
              4,
          }),
        )

        await searchPromise

        const state =
          useAppStore.getState()

        expect(
          state.pdfTextSearchQuery,
        ).toBe(
          '',
        )

        expect(
          state.pdfTextSearchResult,
        ).toBeNull()

        expect(
          state.pdfTextSearchStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )
      },
    )

    it(
      'limpa somente a mensagem de erro da pesquisa',
      () => {
        const result =
          createSearchResult({
            query:
              'internet',

            totalPagesSearched:
              5,
          })

        useAppStore.setState({
          pdfTextSearchQuery:
            'internet',

          pdfTextSearchResult:
            result,

          pdfTextSearchStatus:
            AsyncStatus.SUCCESS,

          pdfTextSearchCompletedPages:
            5,

          pdfTextSearchTotalPages:
            5,

          pdfTextSearchErrorMessage:
            'Erro antigo',
        })

        useAppStore
          .getState()
          .clearPdfTextSearchError()

        const state =
          useAppStore.getState()

        expect(
          state.pdfTextSearchErrorMessage,
        ).toBeNull()

        expect(
          state.pdfTextSearchQuery,
        ).toBe(
          'internet',
        )

        expect(
          state.pdfTextSearchResult,
        ).toEqual(
          result,
        )

        expect(
          state.pdfTextSearchStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )
      },
    )
  },
)
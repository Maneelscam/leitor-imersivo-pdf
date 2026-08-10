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

function createSearchResult(
  query: string,
  totalPagesSearched = 10,
): PdfTextSearchResult {
  return {
    query,

    totalPagesSearched,

    totalOccurrences:
      0,

    pagesWithOccurrences:
      0,

    pageResults:
      [],
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
  'createPdfTextSearchSlice lifecycle',
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
      'ignora progresso depois que o documento pesquisado é fechado',
      async () => {
        const {
          loadedPdfDocument,
          closeDocument,
        } =
          createLoadedPdfDocument()

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
              'internet',
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

        closeDocument()

        onProgress({
          completedPages:
            8,

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

        resolveSearch(
          createSearchResult(
            'internet',
          ),
        )

        await searchPromise
      },
    )

    it(
      'ignora erro pertencente a uma pesquisa anterior',
      async () => {
        const {
          loadedPdfDocument,
        } =
          createLoadedPdfDocument()

        let rejectFirstSearch:
          (
            reason:
              unknown,
          ) => void =
          () => undefined

        const firstPendingSearch =
          new Promise<
            PdfTextSearchResult
          >(
            (
              _resolve,
              reject,
            ) => {
              rejectFirstSearch =
                reject
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
          .mockResolvedValueOnce(
            createSearchResult(
              'segunda',
            ),
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

        await useAppStore
          .getState()
          .searchPdfText(
            'segunda',
          )

        rejectFirstSearch(
          new Error(
            'Erro da pesquisa antiga.',
          ),
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
          state.pdfTextSearchStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )

        expect(
          state.pdfTextSearchErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'ignora erro quando outro documento foi aberto',
      async () => {
        const firstDocument =
          createLoadedPdfDocument()

        const secondDocument =
          createLoadedPdfDocument(
            4,
          )

        let rejectSearch:
          (
            reason:
              unknown,
          ) => void =
          () => undefined

        const pendingSearch =
          new Promise<
            PdfTextSearchResult
          >(
            (
              _resolve,
              reject,
            ) => {
              rejectSearch =
                reject
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

        useAppStore.setState({
          loadedPdfDocument:
            secondDocument
              .loadedPdfDocument,

          pdfTextSearchQuery:
            'documento atual',

          pdfTextSearchStatus:
            AsyncStatus.IDLE,

          pdfTextSearchErrorMessage:
            null,
        })

        rejectSearch(
          new Error(
            'Erro do documento antigo.',
          ),
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
          state.pdfTextSearchStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )

        expect(
          state.pdfTextSearchErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'ignora erro quando o documento pesquisado foi fechado',
      async () => {
        const {
          loadedPdfDocument,
          closeDocument,
        } =
          createLoadedPdfDocument()

        let rejectSearch:
          (
            reason:
              unknown,
          ) => void =
          () => undefined

        const pendingSearch =
          new Promise<
            PdfTextSearchResult
          >(
            (
              _resolve,
              reject,
            ) => {
              rejectSearch =
                reject
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

        rejectSearch(
          new Error(
            'Erro depois do fechamento.',
          ),
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

        expect(
          state.pdfTextSearchErrorMessage,
        ).toBeNull()
      },
    )
  },
)
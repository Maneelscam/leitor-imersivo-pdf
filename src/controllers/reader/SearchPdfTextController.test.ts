import type {
  PDFDocumentProxy,
} from 'pdfjs-dist'
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { SearchPdfTextController } from '@/controllers/reader/SearchPdfTextController'
import type { PdfTextSearchResult } from '@/models/dtos/PdfTextSearchResult'
import type {
  PdfTextSearchOptions,
  PdfTextSearchService,
} from '@/services/pdf/PdfTextSearchService'

function createDocument(): PDFDocumentProxy {
  return {
    numPages: 5,
  } as unknown as PDFDocumentProxy
}

function createResult(
  query = 'internet',
): PdfTextSearchResult {
  return {
    query,
    totalPagesSearched: 5,
    totalOccurrences: 2,
    pagesWithOccurrences: 1,
    pageResults: [
      {
        pageNumber: 2,
        occurrenceCount: 2,
        occurrences: [],
      },
    ],
  }
}

describe('SearchPdfTextController', () => {
  it('delega a busca ao PdfTextSearchService usando opções padrão', async () => {
    const document =
      createDocument()

    const result =
      createResult()

    const search =
      vi.fn().mockResolvedValue(
        result,
      )

    const service = {
      search,
    } as unknown as PdfTextSearchService

    const controller =
      new SearchPdfTextController(
        service,
      )

    await expect(
      controller.execute(
        document,
        'internet',
      ),
    ).resolves.toBe(
      result,
    )

    expect(search).toHaveBeenCalledTimes(
      1,
    )

    expect(search).toHaveBeenCalledWith(
      document,
      'internet',
      {},
    )
  })

  it('encaminha as opções de busca sem alterá-las', async () => {
    const document =
      createDocument()

    const result =
      createResult(
        'fibra',
      )

    const onProgress =
      vi.fn()

    const options:
      PdfTextSearchOptions = {
        onProgress,
      }

    const search =
      vi.fn().mockResolvedValue(
        result,
      )

    const service = {
      search,
    } as unknown as PdfTextSearchService

    const controller =
      new SearchPdfTextController(
        service,
      )

    await expect(
      controller.execute(
        document,
        '  fibra  ',
        options,
      ),
    ).resolves.toBe(
      result,
    )

    expect(search).toHaveBeenCalledWith(
      document,
      '  fibra  ',
      options,
    )
  })

  it('propaga a falha retornada pelo PdfTextSearchService', async () => {
    const searchError =
      new Error(
        'falha na busca',
      )

    const search =
      vi.fn().mockRejectedValue(
        searchError,
      )

    const service = {
      search,
    } as unknown as PdfTextSearchService

    const controller =
      new SearchPdfTextController(
        service,
      )

    await expect(
      controller.execute(
        createDocument(),
        'consulta',
      ),
    ).rejects.toBe(
      searchError,
    )
  })
})

import type {
  PDFDocumentProxy,
  PDFPageProxy,
} from 'pdfjs-dist'

import {
  PdfPageLoadError,
  PdfPageLoadErrorCode,
} from '@/errors/reader/PdfPageLoadError'

const MAX_CACHED_PAGES_PER_DOCUMENT =
  12

type PdfPageCache =
  Map<
    number,
    Promise<PDFPageProxy>
  >

export class PdfPageService {
  private readonly pageCacheByDocument =
    new WeakMap<
      PDFDocumentProxy,
      PdfPageCache
    >()

  async loadPage(
    document: PDFDocumentProxy,
    pageNumber: number,
  ): Promise<PDFPageProxy> {
    const totalPages = Math.max(
      0,
      Math.trunc(
        document.numPages,
      ),
    )

    this.validatePageNumber(
      pageNumber,
      totalPages,
    )

    const pageCache =
      this.getOrCreatePageCache(
        document,
      )

    const cachedPagePromise =
      pageCache.get(
        pageNumber,
      )

    if (
      cachedPagePromise !==
      undefined
    ) {
      this.markAsRecentlyUsed(
        pageCache,
        pageNumber,
        cachedPagePromise,
      )

      return cachedPagePromise
    }

    const pagePromise =
      this.loadPageFromDocument(
        document,
        pageNumber,
        totalPages,
      )

    pageCache.set(
      pageNumber,
      pagePromise,
    )

    this.trimPageCache(
      pageCache,
    )

    try {
      return await pagePromise
    } catch (error) {
      if (
        pageCache.get(
          pageNumber,
        ) === pagePromise
      ) {
        pageCache.delete(
          pageNumber,
        )
      }

      throw error
    }
  }

  private validatePageNumber(
    pageNumber: number,
    totalPages: number,
  ): void {
    if (
      !Number.isFinite(
        pageNumber,
      ) ||
      !Number.isInteger(
        pageNumber,
      ) ||
      pageNumber <= 0
    ) {
      throw new PdfPageLoadError({
        code:
          PdfPageLoadErrorCode.INVALID_PAGE_NUMBER,
        pageNumber,
        totalPages,
      })
    }

    if (
      totalPages === 0 ||
      pageNumber > totalPages
    ) {
      throw new PdfPageLoadError({
        code:
          PdfPageLoadErrorCode.PAGE_OUT_OF_RANGE,
        pageNumber,
        totalPages,
      })
    }
  }

  private getOrCreatePageCache(
    document: PDFDocumentProxy,
  ): PdfPageCache {
    const existingCache =
      this.pageCacheByDocument.get(
        document,
      )

    if (
      existingCache !== undefined
    ) {
      return existingCache
    }

    const newCache:
      PdfPageCache =
        new Map()

    this.pageCacheByDocument.set(
      document,
      newCache,
    )

    return newCache
  }

  private markAsRecentlyUsed(
    pageCache: PdfPageCache,
    pageNumber: number,
    pagePromise:
      Promise<PDFPageProxy>,
  ): void {
    pageCache.delete(
      pageNumber,
    )

    pageCache.set(
      pageNumber,
      pagePromise,
    )
  }

  private trimPageCache(
    pageCache: PdfPageCache,
  ): void {
    while (
      pageCache.size >
      MAX_CACHED_PAGES_PER_DOCUMENT
    ) {
      const oldestPageNumber =
        pageCache
          .keys()
          .next()
          .value

      if (
        oldestPageNumber ===
        undefined
      ) {
        return
      }

      pageCache.delete(
        oldestPageNumber,
      )
    }
  }

  private async loadPageFromDocument(
    document: PDFDocumentProxy,
    pageNumber: number,
    totalPages: number,
  ): Promise<PDFPageProxy> {
    try {
      return await document.getPage(
        pageNumber,
      )
    } catch (error: unknown) {
      throw new PdfPageLoadError({
        code:
          PdfPageLoadErrorCode.PAGE_LOAD_FAILED,
        pageNumber,
        totalPages,
        cause: error,
      })
    }
  }
}
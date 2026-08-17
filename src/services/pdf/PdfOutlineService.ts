import type {
  PDFDocumentProxy,
} from 'pdfjs-dist'

import type {
  PdfOutlineItem,
} from '@/models/dtos/PdfOutlineItem'

type PdfJsOutline =
  Awaited<
    ReturnType<
      PDFDocumentProxy['getOutline']
    >
  >

type PdfJsOutlineItem =
  NonNullable<PdfJsOutline>[number]

type PdfDestination =
  Awaited<
    ReturnType<
      PDFDocumentProxy['getDestination']
    >
  >

type PdfDestinationReference =
  Parameters<
    PDFDocumentProxy['getPageIndex']
  >[0]

function normalizeTitle(
  title: string,
): string {
  const normalizedTitle =
    title
      .replace(
        /\s+/gu,
        ' ',
      )
      .trim()

  return normalizedTitle.length > 0
    ? normalizedTitle
    : 'Item sem título'
}

function createItemId(
  path: readonly number[],
): string {
  return [
    'outline',
    ...path,
  ].join('-')
}

function normalizePageIndex(
  pageIndex: number,
  totalPages: number,
): number | null {
  if (
    !Number.isFinite(pageIndex)
  ) {
    return null
  }

  const normalizedPageIndex =
    Math.trunc(pageIndex)

  if (
    normalizedPageIndex < 0 ||
    normalizedPageIndex >= totalPages
  ) {
    return null
  }

  return normalizedPageIndex
}

async function resolveDestination(
  document: PDFDocumentProxy,
  item: PdfJsOutlineItem,
): Promise<PdfDestination> {
  const destination =
    item.dest

  if (destination === null) {
    return null
  }

  if (
    typeof destination === 'string'
  ) {
    try {
      return await document.getDestination(
        destination,
      )
    } catch {
      return null
    }
  }

  return destination
}

async function resolvePageNumber(
  document: PDFDocumentProxy,
  item: PdfJsOutlineItem,
): Promise<number | null> {
  const destination =
    await resolveDestination(
      document,
      item,
    )

  if (
    destination === null ||
    destination.length === 0
  ) {
    return null
  }

  const destinationTarget =
    destination[0]

  if (
    typeof destinationTarget ===
    'number'
  ) {
    const pageIndex =
      normalizePageIndex(
        destinationTarget,
        document.numPages,
      )

    return pageIndex === null
      ? null
      : pageIndex + 1
  }

  if (
    typeof destinationTarget !==
      'object' ||
    destinationTarget === null
  ) {
    return null
  }

  try {
    const pageIndex =
      await document.getPageIndex(
        destinationTarget as
          PdfDestinationReference,
      )

    const normalizedPageIndex =
      normalizePageIndex(
        pageIndex,
        document.numPages,
      )

    return normalizedPageIndex === null
      ? null
      : normalizedPageIndex + 1
  } catch {
    return null
  }
}

async function createOutlineItems(
  document: PDFDocumentProxy,
  sourceItems:
    readonly PdfJsOutlineItem[],
  parentPath:
    readonly number[] = [],
): Promise<readonly PdfOutlineItem[]> {
  return Promise.all(
    sourceItems.map(
      async (
        sourceItem,
        sourceIndex,
      ) => {
        const itemPath = [
          ...parentPath,
          sourceIndex,
        ]

        const [
          pageNumber,
          children,
        ] = await Promise.all([
          resolvePageNumber(
            document,
            sourceItem,
          ),

          createOutlineItems(
            document,
            sourceItem.items,
            itemPath,
          ),
        ])

        return {
          id:
            createItemId(
              itemPath,
            ),

          title:
            normalizeTitle(
              sourceItem.title,
            ),

          pageNumber,

          children,
        }
      },
    ),
  )
}

export class PdfOutlineService {
  private readonly outlineCache =
    new WeakMap<
      PDFDocumentProxy,
      Promise<
        readonly PdfOutlineItem[]
      >
    >()

  async load(
    document: PDFDocumentProxy,
  ): Promise<
    readonly PdfOutlineItem[]
  > {
    const cachedOutline =
      this.outlineCache.get(
        document,
      )

    if (
      cachedOutline !== undefined
    ) {
      return cachedOutline
    }

    const outlinePromise =
      this.loadOutline(
        document,
      ).catch(
        (error: unknown) => {
          this.outlineCache.delete(
            document,
          )

          throw error
        },
      )

    this.outlineCache.set(
      document,
      outlinePromise,
    )

    return outlinePromise
  }

  private async loadOutline(
    document: PDFDocumentProxy,
  ): Promise<
    readonly PdfOutlineItem[]
  > {
    const outline =
      await document.getOutline()

    if (
      outline === null ||
      outline.length === 0
    ) {
      return []
    }

    return createOutlineItems(
      document,
      outline,
    )
  }
}
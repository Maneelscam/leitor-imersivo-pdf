import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { applicationContainer } from '@/app/providers/applicationContainer'
import type { OpenBookResult } from '@/models/dtos/OpenBookResult'
import type { Bookmark } from '@/models/entities/Bookmark'
import { AsyncStatus } from '@/models/enums/AsyncStatus'
import type { BookmarkId } from '@/models/value-objects/BookmarkId'
import type { BookId } from '@/models/value-objects/BookId'
import type { IsoDateTime } from '@/models/value-objects/IsoDateTime'
import { useAppStore } from '@/stores/useAppStore'

const FIRST_BOOK_ID = 'reader-bookmarks-book-1' as BookId
const SECOND_BOOK_ID = 'reader-bookmarks-book-2' as BookId
const TEST_DATE = '2026-08-10T10:00:00.000Z' as IsoDateTime

function createOpenedBook(bookId: BookId, totalPages = 30): OpenBookResult {
  return {
    book: {
      id: bookId,
      title: `Livro ${bookId}`,
      author: null,
      originalFileName: `${bookId}.pdf`,
      fileSizeBytes: 1024,
      mimeType: 'application/pdf',
      totalPages,
      pdfFingerprint: null,
      importedAt: TEST_DATE,
      updatedAt: TEST_DATE,
      lastOpenedAt: TEST_DATE,
    },
    bookFile: {
      bookId,
      file: new Blob(['%PDF'], { type: 'application/pdf' }),
      storedAt: TEST_DATE,
    },
    readingProgress: null,
  }
}

function createBookmark(
  id: string,
  bookId: BookId,
  pageNumber: number,
  pageOffsetRatio: number,
  createdAt: IsoDateTime = TEST_DATE,
): Bookmark {
  return {
    id: id as BookmarkId,
    bookId,
    pageNumber,
    pageOffsetRatio,
    createdAt,
  }
}

function resetBookmarkState(): void {
  useAppStore.setState({
    openedBook: null,
    bookmarks: [],
    currentPage: 1,
    pageOffsetRatio: 0,
    bookmarksLoadStatus: AsyncStatus.IDLE,
    bookmarkMutationStatus: AsyncStatus.IDLE,
    bookmarkErrorMessage: null,
  })
}

describe('createReaderSlice bookmarks', () => {
  beforeEach(() => {
    resetBookmarkState()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetBookmarkState()
  })

  it('limpa os favoritos quando nenhum livro está aberto', async () => {
    const staleBookmark = createBookmark('bookmark-stale', FIRST_BOOK_ID, 4, 0.2)

    useAppStore.setState({
      bookmarks: [staleBookmark],
      bookmarksLoadStatus: AsyncStatus.ERROR,
      bookmarkErrorMessage: 'Erro antigo.',
    })

    const loadSpy = vi.spyOn(
      applicationContainer.controllers.loadBookmarks,
      'execute',
    )

    await useAppStore.getState().loadBookmarks()

    const state = useAppStore.getState()

    expect(loadSpy).not.toHaveBeenCalled()
    expect(state.bookmarks).toEqual([])
    expect(state.bookmarksLoadStatus).toBe(AsyncStatus.IDLE)
    expect(state.bookmarkErrorMessage).toBeNull()
  })

  it('não carrega favoritos enquanto uma mutação está em andamento', async () => {
    const existingBookmark = createBookmark(
      'bookmark-existing',
      FIRST_BOOK_ID,
      3,
      0.1,
    )

    useAppStore.setState({
      openedBook: createOpenedBook(FIRST_BOOK_ID),
      bookmarks: [existingBookmark],
      bookmarksLoadStatus: AsyncStatus.SUCCESS,
      bookmarkMutationStatus: AsyncStatus.LOADING,
    })

    const loadSpy = vi.spyOn(
      applicationContainer.controllers.loadBookmarks,
      'execute',
    )

    await useAppStore.getState().loadBookmarks()

    const state = useAppStore.getState()

    expect(loadSpy).not.toHaveBeenCalled()
    expect(state.bookmarks).toEqual([existingBookmark])
    expect(state.bookmarksLoadStatus).toBe(AsyncStatus.SUCCESS)
    expect(state.bookmarkMutationStatus).toBe(AsyncStatus.LOADING)
  })

  it('carrega os favoritos do livro aberto', async () => {
    const bookmarks = [
      createBookmark('bookmark-1', FIRST_BOOK_ID, 2, 0.1),
      createBookmark('bookmark-2', FIRST_BOOK_ID, 8, 0.4),
    ]

    useAppStore.setState({
      openedBook: createOpenedBook(FIRST_BOOK_ID),
    })

    const loadSpy = vi
      .spyOn(applicationContainer.controllers.loadBookmarks, 'execute')
      .mockResolvedValue(bookmarks)

    await useAppStore.getState().loadBookmarks()

    expect(loadSpy).toHaveBeenCalledTimes(1)
    expect(loadSpy).toHaveBeenCalledWith(FIRST_BOOK_ID)

    const state = useAppStore.getState()

    expect(state.bookmarks).toEqual(bookmarks)
    expect(state.bookmarksLoadStatus).toBe(AsyncStatus.SUCCESS)
    expect(state.bookmarkErrorMessage).toBeNull()
  })

  it('registra erro quando o carregamento de favoritos falha', async () => {
    useAppStore.setState({
      openedBook: createOpenedBook(FIRST_BOOK_ID),
    })

    vi.spyOn(
      applicationContainer.controllers.loadBookmarks,
      'execute',
    ).mockRejectedValue(new Error('Falha simulada ao carregar favoritos.'))

    await useAppStore.getState().loadBookmarks()

    const state = useAppStore.getState()

    expect(state.bookmarksLoadStatus).toBe(AsyncStatus.ERROR)
    expect(state.bookmarkErrorMessage).not.toBeNull()
  })

  it('ignora resultado antigo de favoritos quando outro livro é aberto', async () => {
    const firstBook = createOpenedBook(FIRST_BOOK_ID)
    const secondBook = createOpenedBook(SECOND_BOOK_ID)
    const secondBookmark = createBookmark(
      'bookmark-second',
      SECOND_BOOK_ID,
      2,
      0.2,
    )

    let resolveLoad: (bookmarks: readonly Bookmark[]) => void = () => undefined

    const pendingLoad = new Promise<readonly Bookmark[]>((resolve) => {
      resolveLoad = resolve
    })

    vi.spyOn(
      applicationContainer.controllers.loadBookmarks,
      'execute',
    ).mockReturnValue(pendingLoad)

    useAppStore.setState({ openedBook: firstBook })

    const loadPromise = useAppStore.getState().loadBookmarks()

    useAppStore.setState({
      openedBook: secondBook,
      bookmarks: [secondBookmark],
      bookmarksLoadStatus: AsyncStatus.SUCCESS,
      bookmarkErrorMessage: null,
    })

    resolveLoad([
      createBookmark('bookmark-old', FIRST_BOOK_ID, 9, 0.5),
    ])

    await loadPromise

    const state = useAppStore.getState()

    expect(state.openedBook).toBe(secondBook)
    expect(state.bookmarks).toEqual([secondBookmark])
    expect(state.bookmarksLoadStatus).toBe(AsyncStatus.SUCCESS)
    expect(state.bookmarkErrorMessage).toBeNull()
  })

  it('ignora erro antigo de carregamento quando outro livro é aberto', async () => {
    const secondBook = createOpenedBook(SECOND_BOOK_ID)

    let rejectLoad: (reason: unknown) => void = () => undefined

    const pendingLoad = new Promise<readonly Bookmark[]>((_resolve, reject) => {
      rejectLoad = reject
    })

    vi.spyOn(
      applicationContainer.controllers.loadBookmarks,
      'execute',
    ).mockReturnValue(pendingLoad)

    useAppStore.setState({
      openedBook: createOpenedBook(FIRST_BOOK_ID),
    })

    const loadPromise = useAppStore.getState().loadBookmarks()

    useAppStore.setState({
      openedBook: secondBook,
      bookmarksLoadStatus: AsyncStatus.IDLE,
      bookmarkErrorMessage: null,
    })

    rejectLoad(new Error('Erro antigo.'))

    await loadPromise

    const state = useAppStore.getState()

    expect(state.openedBook).toBe(secondBook)
    expect(state.bookmarksLoadStatus).toBe(AsyncStatus.IDLE)
    expect(state.bookmarkErrorMessage).toBeNull()
  })

  it('retorna erro ao criar favorito sem livro aberto', async () => {
    const createSpy = vi.spyOn(
      applicationContainer.controllers.createBookmark,
      'execute',
    )

    await useAppStore.getState().createCurrentPageBookmark()

    const state = useAppStore.getState()

    expect(createSpy).not.toHaveBeenCalled()
    expect(state.bookmarkMutationStatus).toBe(AsyncStatus.ERROR)
    expect(state.bookmarkErrorMessage).not.toBeNull()
  })

  it('cria favorito usando a página e o deslocamento atuais', async () => {
    const firstBookmark = createBookmark(
      'bookmark-page-2',
      FIRST_BOOK_ID,
      2,
      0.3,
    )
    const lastBookmark = createBookmark(
      'bookmark-page-10',
      FIRST_BOOK_ID,
      10,
      0.1,
    )
    const createdBookmark = createBookmark(
      'bookmark-page-6',
      FIRST_BOOK_ID,
      6,
      0.45,
    )

    useAppStore.setState({
      openedBook: createOpenedBook(FIRST_BOOK_ID),
      currentPage: 6,
      pageOffsetRatio: 0.45,
      bookmarks: [lastBookmark, firstBookmark],
    })

    const createSpy = vi
      .spyOn(applicationContainer.controllers.createBookmark, 'execute')
      .mockResolvedValue(createdBookmark)

    await useAppStore.getState().createCurrentPageBookmark()

    expect(createSpy).toHaveBeenCalledTimes(1)
    expect(createSpy).toHaveBeenCalledWith({
      bookId: FIRST_BOOK_ID,
      pageNumber: 6,
      pageOffsetRatio: 0.45,
    })

    const state = useAppStore.getState()

    expect(state.bookmarks.map((bookmark) => bookmark.pageNumber)).toEqual([
      2,
      6,
      10,
    ])
    expect(state.bookmarkMutationStatus).toBe(AsyncStatus.SUCCESS)
    expect(state.bookmarksLoadStatus).toBe(AsyncStatus.SUCCESS)
    expect(state.bookmarkErrorMessage).toBeNull()
  })

  it('substitui favorito com o mesmo id sem criar duplicidade', async () => {
    const bookmarkId = 'bookmark-duplicate'

    const oldBookmark = createBookmark(
      bookmarkId,
      FIRST_BOOK_ID,
      3,
      0.1,
    )
    const updatedBookmark = createBookmark(
      bookmarkId,
      FIRST_BOOK_ID,
      9,
      0.7,
    )

    useAppStore.setState({
      openedBook: createOpenedBook(FIRST_BOOK_ID),
      currentPage: 9,
      pageOffsetRatio: 0.7,
      bookmarks: [
        oldBookmark,
        createBookmark('bookmark-other', FIRST_BOOK_ID, 5, 0.2),
      ],
    })

    vi.spyOn(
      applicationContainer.controllers.createBookmark,
      'execute',
    ).mockResolvedValue(updatedBookmark)

    await useAppStore.getState().createCurrentPageBookmark()

    const state = useAppStore.getState()

    expect(
      state.bookmarks.filter((bookmark) => bookmark.id === updatedBookmark.id),
    ).toHaveLength(1)
    expect(
      state.bookmarks.find((bookmark) => bookmark.id === updatedBookmark.id),
    ).toBe(updatedBookmark)
    expect(state.bookmarks.map((bookmark) => bookmark.pageNumber)).toEqual([
      5,
      9,
    ])
  })

  it('registra erro quando a criação do favorito falha', async () => {
    useAppStore.setState({
      openedBook: createOpenedBook(FIRST_BOOK_ID),
      currentPage: 4,
      pageOffsetRatio: 0.25,
    })

    vi.spyOn(
      applicationContainer.controllers.createBookmark,
      'execute',
    ).mockRejectedValue(new Error('Falha simulada na criação.'))

    await useAppStore.getState().createCurrentPageBookmark()

    const state = useAppStore.getState()

    expect(state.bookmarkMutationStatus).toBe(AsyncStatus.ERROR)
    expect(state.bookmarkErrorMessage).not.toBeNull()
  })

  it('não inicia outra criação enquanto uma mutação está carregando', async () => {
    useAppStore.setState({
      openedBook: createOpenedBook(FIRST_BOOK_ID),
      bookmarkMutationStatus: AsyncStatus.LOADING,
    })

    const createSpy = vi.spyOn(
      applicationContainer.controllers.createBookmark,
      'execute',
    )

    await useAppStore.getState().createCurrentPageBookmark()

    expect(createSpy).not.toHaveBeenCalled()
    expect(useAppStore.getState().bookmarkMutationStatus).toBe(
      AsyncStatus.LOADING,
    )
  })

  it('ignora criação antiga quando outro livro é aberto', async () => {
    const secondBook = createOpenedBook(SECOND_BOOK_ID)
    const secondBookmark = createBookmark(
      'bookmark-second',
      SECOND_BOOK_ID,
      2,
      0.1,
    )

    let resolveCreate: (bookmark: Bookmark) => void = () => undefined

    const pendingCreate = new Promise<Bookmark>((resolve) => {
      resolveCreate = resolve
    })

    vi.spyOn(
      applicationContainer.controllers.createBookmark,
      'execute',
    ).mockReturnValue(pendingCreate)

    useAppStore.setState({
      openedBook: createOpenedBook(FIRST_BOOK_ID),
      currentPage: 7,
      pageOffsetRatio: 0.3,
    })

    const createPromise = useAppStore.getState().createCurrentPageBookmark()

    useAppStore.setState({
      openedBook: secondBook,
      bookmarks: [secondBookmark],
      bookmarkMutationStatus: AsyncStatus.IDLE,
      bookmarkErrorMessage: null,
    })

    resolveCreate(
      createBookmark('bookmark-old', FIRST_BOOK_ID, 7, 0.3),
    )

    await createPromise

    const state = useAppStore.getState()

    expect(state.openedBook).toBe(secondBook)
    expect(state.bookmarks).toEqual([secondBookmark])
    expect(state.bookmarkMutationStatus).toBe(AsyncStatus.IDLE)
    expect(state.bookmarkErrorMessage).toBeNull()
  })

  it('ignora erro antigo de criação quando outro livro é aberto', async () => {
    const secondBook = createOpenedBook(SECOND_BOOK_ID)

    let rejectCreate: (reason: unknown) => void = () => undefined

    const pendingCreate = new Promise<Bookmark>((_resolve, reject) => {
      rejectCreate = reject
    })

    vi.spyOn(
      applicationContainer.controllers.createBookmark,
      'execute',
    ).mockReturnValue(pendingCreate)

    useAppStore.setState({
      openedBook: createOpenedBook(FIRST_BOOK_ID),
    })

    const createPromise = useAppStore.getState().createCurrentPageBookmark()

    useAppStore.setState({
      openedBook: secondBook,
      bookmarkMutationStatus: AsyncStatus.IDLE,
      bookmarkErrorMessage: null,
    })

    rejectCreate(new Error('Erro antigo de criação.'))

    await createPromise

    const state = useAppStore.getState()

    expect(state.openedBook).toBe(secondBook)
    expect(state.bookmarkMutationStatus).toBe(AsyncStatus.IDLE)
    expect(state.bookmarkErrorMessage).toBeNull()
  })

  it('criação de favorito invalida carregamento antigo de favoritos', async () => {
    const createdBookmark = createBookmark(
      'bookmark-created',
      FIRST_BOOK_ID,
      5,
      0.4,
    )

    let resolveLoad: (bookmarks: readonly Bookmark[]) => void = () => undefined

    const pendingLoad = new Promise<readonly Bookmark[]>((resolve) => {
      resolveLoad = resolve
    })

    vi.spyOn(
      applicationContainer.controllers.loadBookmarks,
      'execute',
    ).mockReturnValue(pendingLoad)

    vi.spyOn(
      applicationContainer.controllers.createBookmark,
      'execute',
    ).mockResolvedValue(createdBookmark)

    useAppStore.setState({
      openedBook: createOpenedBook(FIRST_BOOK_ID),
      currentPage: 5,
      pageOffsetRatio: 0.4,
    })

    const loadPromise = useAppStore.getState().loadBookmarks()

    await useAppStore.getState().createCurrentPageBookmark()

    resolveLoad([
      createBookmark('bookmark-old-load', FIRST_BOOK_ID, 2, 0.1),
    ])

    await loadPromise

    const state = useAppStore.getState()

    expect(state.bookmarks).toEqual([createdBookmark])
    expect(state.bookmarkMutationStatus).toBe(AsyncStatus.SUCCESS)
  })

  it('retorna erro ao excluir favorito sem livro aberto', async () => {
    const bookmarkId = 'bookmark-delete' as BookmarkId

    const deleteSpy = vi.spyOn(
      applicationContainer.controllers.deleteBookmark,
      'execute',
    )

    await useAppStore.getState().deleteBookmark(bookmarkId)

    const state = useAppStore.getState()

    expect(deleteSpy).not.toHaveBeenCalled()
    expect(state.bookmarkMutationStatus).toBe(AsyncStatus.ERROR)
    expect(state.bookmarkErrorMessage).not.toBeNull()
  })

  it('exclui favorito da lista atual', async () => {
    const firstBookmark = createBookmark(
      'bookmark-delete-1',
      FIRST_BOOK_ID,
      3,
      0.1,
    )
    const secondBookmark = createBookmark(
      'bookmark-delete-2',
      FIRST_BOOK_ID,
      7,
      0.5,
    )

    useAppStore.setState({
      openedBook: createOpenedBook(FIRST_BOOK_ID),
      bookmarks: [firstBookmark, secondBookmark],
    })

    const deleteSpy = vi
      .spyOn(applicationContainer.controllers.deleteBookmark, 'execute')
      .mockResolvedValue(undefined)

    await useAppStore.getState().deleteBookmark(firstBookmark.id)

    expect(deleteSpy).toHaveBeenCalledTimes(1)
    expect(deleteSpy).toHaveBeenCalledWith(firstBookmark.id)

    const state = useAppStore.getState()

    expect(state.bookmarks).toEqual([secondBookmark])
    expect(state.bookmarkMutationStatus).toBe(AsyncStatus.SUCCESS)
    expect(state.bookmarksLoadStatus).toBe(AsyncStatus.SUCCESS)
    expect(state.bookmarkErrorMessage).toBeNull()
  })

  it('mantém os favoritos e registra erro quando a exclusão falha', async () => {
    const bookmark = createBookmark(
      'bookmark-delete-error',
      FIRST_BOOK_ID,
      4,
      0.2,
    )

    useAppStore.setState({
      openedBook: createOpenedBook(FIRST_BOOK_ID),
      bookmarks: [bookmark],
    })

    vi.spyOn(
      applicationContainer.controllers.deleteBookmark,
      'execute',
    ).mockRejectedValue(new Error('Falha simulada na exclusão.'))

    await useAppStore.getState().deleteBookmark(bookmark.id)

    const state = useAppStore.getState()

    expect(state.bookmarks).toEqual([bookmark])
    expect(state.bookmarkMutationStatus).toBe(AsyncStatus.ERROR)
    expect(state.bookmarkErrorMessage).not.toBeNull()
  })

  it('não inicia exclusão enquanto outra mutação está carregando', async () => {
    const bookmark = createBookmark(
      'bookmark-blocked-delete',
      FIRST_BOOK_ID,
      3,
      0.1,
    )

    useAppStore.setState({
      openedBook: createOpenedBook(FIRST_BOOK_ID),
      bookmarks: [bookmark],
      bookmarkMutationStatus: AsyncStatus.LOADING,
    })

    const deleteSpy = vi.spyOn(
      applicationContainer.controllers.deleteBookmark,
      'execute',
    )

    await useAppStore.getState().deleteBookmark(bookmark.id)

    expect(deleteSpy).not.toHaveBeenCalled()
    expect(useAppStore.getState().bookmarks).toEqual([bookmark])
  })

  it('ignora exclusão antiga quando outro livro é aberto', async () => {
    const oldBookmark = createBookmark(
      'bookmark-old-delete',
      FIRST_BOOK_ID,
      4,
      0.2,
    )
    const secondBookmark = createBookmark(
      'bookmark-second',
      SECOND_BOOK_ID,
      2,
      0.1,
    )

    let resolveDelete: () => void = () => undefined

    const pendingDelete = new Promise<void>((resolve) => {
      resolveDelete = () => resolve()
    })

    vi.spyOn(
      applicationContainer.controllers.deleteBookmark,
      'execute',
    ).mockReturnValue(pendingDelete)

    useAppStore.setState({
      openedBook: createOpenedBook(FIRST_BOOK_ID),
      bookmarks: [oldBookmark],
    })

    const deletePromise = useAppStore.getState().deleteBookmark(oldBookmark.id)
    const secondBook = createOpenedBook(SECOND_BOOK_ID)

    useAppStore.setState({
      openedBook: secondBook,
      bookmarks: [secondBookmark],
      bookmarkMutationStatus: AsyncStatus.IDLE,
      bookmarkErrorMessage: null,
    })

    resolveDelete()
    await deletePromise

    const state = useAppStore.getState()

    expect(state.openedBook).toBe(secondBook)
    expect(state.bookmarks).toEqual([secondBookmark])
    expect(state.bookmarkMutationStatus).toBe(AsyncStatus.IDLE)
  })

  it('ignora erro antigo de exclusão quando outro livro é aberto', async () => {
    const bookmark = createBookmark(
      'bookmark-old-delete-error',
      FIRST_BOOK_ID,
      4,
      0.2,
    )

    let rejectDelete: (reason: unknown) => void = () => undefined

    const pendingDelete = new Promise<void>((_resolve, reject) => {
      rejectDelete = reject
    })

    vi.spyOn(
      applicationContainer.controllers.deleteBookmark,
      'execute',
    ).mockReturnValue(pendingDelete)

    useAppStore.setState({
      openedBook: createOpenedBook(FIRST_BOOK_ID),
      bookmarks: [bookmark],
    })

    const deletePromise = useAppStore.getState().deleteBookmark(bookmark.id)
    const secondBook = createOpenedBook(SECOND_BOOK_ID)

    useAppStore.setState({
      openedBook: secondBook,
      bookmarks: [],
      bookmarkMutationStatus: AsyncStatus.IDLE,
      bookmarkErrorMessage: null,
    })

    rejectDelete(new Error('Erro antigo de exclusão.'))
    await deletePromise

    const state = useAppStore.getState()

    expect(state.openedBook).toBe(secondBook)
    expect(state.bookmarkMutationStatus).toBe(AsyncStatus.IDLE)
    expect(state.bookmarkErrorMessage).toBeNull()
  })

  it('exclusão de favorito invalida carregamento antigo', async () => {
    const bookmarkToDelete = createBookmark(
      'bookmark-delete-current',
      FIRST_BOOK_ID,
      5,
      0.3,
    )
    const bookmarkToKeep = createBookmark(
      'bookmark-keep',
      FIRST_BOOK_ID,
      8,
      0.4,
    )

    let resolveLoad: (bookmarks: readonly Bookmark[]) => void = () => undefined

    const pendingLoad = new Promise<readonly Bookmark[]>((resolve) => {
      resolveLoad = resolve
    })

    vi.spyOn(
      applicationContainer.controllers.loadBookmarks,
      'execute',
    ).mockReturnValue(pendingLoad)

    vi.spyOn(
      applicationContainer.controllers.deleteBookmark,
      'execute',
    ).mockResolvedValue(undefined)

    useAppStore.setState({
      openedBook: createOpenedBook(FIRST_BOOK_ID),
      bookmarks: [bookmarkToDelete, bookmarkToKeep],
    })

    const loadPromise = useAppStore.getState().loadBookmarks()

    await useAppStore.getState().deleteBookmark(bookmarkToDelete.id)

    resolveLoad([bookmarkToDelete, bookmarkToKeep])
    await loadPromise

    const state = useAppStore.getState()

    expect(state.bookmarks).toEqual([bookmarkToKeep])
    expect(state.bookmarkMutationStatus).toBe(AsyncStatus.SUCCESS)
  })

  it('limpa somente o erro de favoritos', () => {
    const bookmark = createBookmark(
      'bookmark-clear-error',
      FIRST_BOOK_ID,
      2,
      0.1,
    )

    useAppStore.setState({
      openedBook: createOpenedBook(FIRST_BOOK_ID),
      bookmarks: [bookmark],
      bookmarksLoadStatus: AsyncStatus.ERROR,
      bookmarkMutationStatus: AsyncStatus.ERROR,
      bookmarkErrorMessage: 'Erro de favorito.',
    })

    useAppStore.getState().clearBookmarkError()

    const state = useAppStore.getState()

    expect(state.bookmarkErrorMessage).toBeNull()
    expect(state.bookmarks).toEqual([bookmark])
    expect(state.bookmarksLoadStatus).toBe(AsyncStatus.ERROR)
    expect(state.bookmarkMutationStatus).toBe(AsyncStatus.ERROR)
  })
})

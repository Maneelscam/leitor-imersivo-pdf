import type {
  StateCreator,
} from 'zustand'
import {
  createStore,
} from 'zustand/vanilla'
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { AsyncStatus } from '@/models/enums/AsyncStatus'
import type {
  AppStore,
} from '@/stores/appStore.types'
import {
  createLibraryBackupSlice,
} from '@/stores/slices/createLibraryBackupSlice'

const mocks = vi.hoisted(
  () => ({
    exportBackup:
      vi.fn(),

    restoreBackup:
      vi.fn(),

    downloadBlob:
      vi.fn(),
  }),
)

vi.mock(
  '@/app/providers/applicationContainer',
  () => ({
    applicationContainer: {
      controllers: {
        exportLibraryBackup: {
          execute:
            mocks.exportBackup,
        },

        restoreLibraryBackup: {
          execute:
            mocks.restoreBackup,
        },
      },
    },
  }),
)

vi.mock(
  '@/utils/files/downloadBlob',
  () => ({
    downloadBlob:
      mocks.downloadBlob,
  }),
)

function createStoreForTest() {
  return createStore<AppStore>()(
    createLibraryBackupSlice as unknown as StateCreator<AppStore>,
  )
}

describe(
  'createLibraryBackupSlice',
  () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it(
      'inicia com estado padrão de backup',
      () => {
        const store =
          createStoreForTest()

        expect(
          store.getState(),
        ).toMatchObject({
          libraryBackupExportStatus:
            AsyncStatus.IDLE,

          libraryBackupRestoreStatus:
            AsyncStatus.IDLE,

          libraryBackupErrorMessage:
            null,
        })
      },
    )

    it(
      'exporta o backup, baixa o ZIP e marca sucesso',
      async () => {
        const archive =
          new Blob(
            [
              new ArrayBuffer(
                2,
              ),
            ],
            {
              type:
                'application/zip',
            },
          )

        mocks.exportBackup
          .mockResolvedValue({
            archive,
            fileName:
              'backup.zip',
          })

        const store =
          createStoreForTest()

        await store
          .getState()
          .exportLibraryBackup()

        expect(
          mocks.exportBackup,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          mocks.downloadBlob,
        ).toHaveBeenCalledWith(
          archive,
          'backup.zip',
        )

        expect(
          store.getState(),
        ).toMatchObject({
          libraryBackupExportStatus:
            AsyncStatus.SUCCESS,

          libraryBackupErrorMessage:
            null,
        })
      },
    )

    it(
      'registra erro quando a exportação falha',
      async () => {
        mocks.exportBackup
          .mockRejectedValue(
            new Error(
              'falha ao exportar',
            ),
          )

        const store =
          createStoreForTest()

        await store
          .getState()
          .exportLibraryBackup()

        expect(
          mocks.downloadBlob,
        ).not.toHaveBeenCalled()

        expect(
          store.getState(),
        ).toMatchObject({
          libraryBackupExportStatus:
            AsyncStatus.ERROR,

          libraryBackupErrorMessage:
            'falha ao exportar',
        })
      },
    )

    it.each([
      [
        'exportação',
        {
          libraryBackupExportStatus:
            AsyncStatus.LOADING,
        },
      ],
      [
        'restauração',
        {
          libraryBackupRestoreStatus:
            AsyncStatus.LOADING,
        },
      ],
    ])(
      'não inicia nova exportação enquanto há %s em andamento',
      async (
        _label,
        state,
      ) => {
        const store =
          createStoreForTest()

        store.setState(
          state as Partial<AppStore>,
        )

        await store
          .getState()
          .exportLibraryBackup()

        expect(
          mocks.exportBackup,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'fecha livro aberto, restaura backup e recarrega biblioteca e configurações',
      async () => {
        const archiveFile =
          new File(
            [
              new ArrayBuffer(
                2,
              ),
            ],
            'backup.zip',
            {
              type:
                'application/zip',
            },
          )

        const closeBook =
          vi.fn().mockResolvedValue(
            undefined,
          )

        const loadLibrary =
          vi.fn().mockResolvedValue(
            undefined,
          )

        const loadReaderSettings =
          vi.fn().mockResolvedValue(
            undefined,
          )

        mocks.restoreBackup
          .mockResolvedValue(
            {
              manifest: {},
            },
          )

        const store =
          createStoreForTest()

        store.setState({
          openedBook: {
            book: {
              id:
                'livro-aberto',
            },
          } as AppStore['openedBook'],

          closeBook,
          loadLibrary,
          loadReaderSettings,
        } as Partial<AppStore>)

        await store
          .getState()
          .restoreLibraryBackup(
            archiveFile,
          )

        expect(
          closeBook,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          mocks.restoreBackup,
        ).toHaveBeenCalledWith({
          archiveFile,
        })

        expect(
          closeBook.mock.invocationCallOrder[0],
        ).toBeLessThan(
          mocks.restoreBackup
            .mock.invocationCallOrder[0] ?? 0,
        )

        expect(
          loadLibrary,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          loadReaderSettings,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          store.getState(),
        ).toMatchObject({
          libraryBackupRestoreStatus:
            AsyncStatus.SUCCESS,

          libraryBackupErrorMessage:
            null,
        })
      },
    )

    it(
      'não tenta fechar livro quando nenhum livro está aberto',
      async () => {
        const closeBook =
          vi.fn()

        mocks.restoreBackup
          .mockResolvedValue(
            {
              manifest: {},
            },
          )

        const store =
          createStoreForTest()

        store.setState({
          openedBook: null,
          closeBook,

          loadLibrary:
            vi.fn().mockResolvedValue(
              undefined,
            ),

          loadReaderSettings:
            vi.fn().mockResolvedValue(
              undefined,
            ),
        } as Partial<AppStore>)

        await store
          .getState()
          .restoreLibraryBackup(
            new File(
              [
                new ArrayBuffer(
                  1,
                ),
              ],
              'backup.zip',
            ),
          )

        expect(
          closeBook,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'registra erro e não recarrega dados quando a restauração falha',
      async () => {
        const loadLibrary =
          vi.fn()

        const loadReaderSettings =
          vi.fn()

        mocks.restoreBackup
          .mockRejectedValue(
            new Error(
              'backup inválido',
            ),
          )

        const store =
          createStoreForTest()

        store.setState({
          openedBook: null,
          closeBook:
            vi.fn(),

          loadLibrary,
          loadReaderSettings,
        } as Partial<AppStore>)

        await store
          .getState()
          .restoreLibraryBackup(
            new File(
              [
                new ArrayBuffer(
                  1,
                ),
              ],
              'backup.zip',
            ),
          )

        expect(
          loadLibrary,
        ).not.toHaveBeenCalled()

        expect(
          loadReaderSettings,
        ).not.toHaveBeenCalled()

        expect(
          store.getState(),
        ).toMatchObject({
          libraryBackupRestoreStatus:
            AsyncStatus.ERROR,

          libraryBackupErrorMessage:
            'backup inválido',
        })
      },
    )

    it.each([
      [
        'exportação',
        {
          libraryBackupExportStatus:
            AsyncStatus.LOADING,
        },
      ],
      [
        'restauração',
        {
          libraryBackupRestoreStatus:
            AsyncStatus.LOADING,
        },
      ],
    ])(
      'não inicia nova restauração enquanto há %s em andamento',
      async (
        _label,
        state,
      ) => {
        const store =
          createStoreForTest()

        store.setState(
          state as Partial<AppStore>,
        )

        await store
          .getState()
          .restoreLibraryBackup(
            new File(
              [
                new ArrayBuffer(
                  1,
                ),
              ],
              'backup.zip',
            ),
          )

        expect(
          mocks.restoreBackup,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'limpa erro e redefine apenas o status de restauração',
      () => {
        const store =
          createStoreForTest()

        store.setState({
          libraryBackupExportStatus:
            AsyncStatus.SUCCESS,

          libraryBackupRestoreStatus:
            AsyncStatus.SUCCESS,

          libraryBackupErrorMessage:
            'erro anterior',
        } as Partial<AppStore>)

        store
          .getState()
          .clearLibraryBackupError()

        store
          .getState()
          .resetLibraryBackupRestoreStatus()

        expect(
          store.getState(),
        ).toMatchObject({
          libraryBackupExportStatus:
            AsyncStatus.SUCCESS,

          libraryBackupRestoreStatus:
            AsyncStatus.IDLE,

          libraryBackupErrorMessage:
            null,
        })
      },
    )
  },
)

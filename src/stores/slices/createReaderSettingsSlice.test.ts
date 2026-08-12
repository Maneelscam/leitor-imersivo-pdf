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

import type {
  SaveReaderSettingsCommand,
} from '@/controllers/settings/SaveReaderSettingsController'
import type {
  ReaderSettings,
} from '@/models/entities/ReaderSettings'
import { AsyncStatus } from '@/models/enums/AsyncStatus'
import { PageDisplayMode } from '@/models/enums/PageDisplayMode'
import { ReadingFlowMode } from '@/models/enums/ReadingFlowMode'
import { ZoomMode } from '@/models/enums/ZoomMode'
import type {
  AppStore,
} from '@/stores/appStore.types'
import {
  createReaderSettingsSlice,
} from '@/stores/slices/createReaderSettingsSlice'

const controllerMocks = vi.hoisted(
  () => ({
    load:
      vi.fn(),

    save:
      vi.fn(),

    reset:
      vi.fn(),
  }),
)

vi.mock(
  '@/app/providers/applicationContainer',
  () => ({
    applicationContainer: {
      controllers: {
        loadReaderSettings: {
          execute:
            controllerMocks.load,
        },

        saveReaderSettings: {
          execute:
            controllerMocks.save,
        },

        resetReaderSettings: {
          execute:
            controllerMocks.reset,
        },
      },
    },
  }),
)

function createStoreForTest() {
  return createStore<AppStore>()(
    createReaderSettingsSlice as unknown as StateCreator<AppStore>,
  )
}

function createSettings(
  overrides:
    Partial<ReaderSettings> = {},
): ReaderSettings {
  return {
    pageDisplayMode:
      PageDisplayMode.SINGLE,

    readingFlowMode:
      ReadingFlowMode.PAGINATED,

    zoomMode:
      ZoomMode.FIT_WIDTH,

    customZoomScale: 1,

    enableKeyboardShortcuts:
      true,

    autoHideReaderControls:
      false,

    updatedAt:
      '2026-08-12T12:00:00.000Z' as ReaderSettings['updatedAt'],

    ...overrides,
  }
}

function createSaveCommand():
  SaveReaderSettingsCommand {
  return {
    pageDisplayMode:
      PageDisplayMode.SINGLE,

    readingFlowMode:
      ReadingFlowMode.PAGINATED,

    zoomMode:
      ZoomMode.FIT_WIDTH,

    customZoomScale: 1,

    enableKeyboardShortcuts:
      true,

    autoHideReaderControls:
      false,
  }
}

function createDeferred<T>() {
  let resolvePromise:
    (value: T) => void =
      () => undefined

  let rejectPromise:
    (reason?: unknown) => void =
      () => undefined

  const promise =
    new Promise<T>(
      (
        resolve,
        reject,
      ) => {
        resolvePromise =
          resolve

        rejectPromise =
          reject
      },
    )

  return {
    promise,
    resolve:
      resolvePromise,
    reject:
      rejectPromise,
  }
}

describe(
  'createReaderSettingsSlice',
  () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it(
      'inicia com estado padrão das configurações',
      () => {
        const store =
          createStoreForTest()

        expect(
          store.getState(),
        ).toMatchObject({
          readerSettings:
            null,

          readerSettingsLoadStatus:
            AsyncStatus.IDLE,

          readerSettingsSaveStatus:
            AsyncStatus.IDLE,

          readerSettingsErrorMessage:
            null,
        })
      },
    )

    it(
      'carrega configurações e marca sucesso',
      async () => {
        const settings =
          createSettings()

        controllerMocks.load
          .mockResolvedValue(
            settings,
          )

        const store =
          createStoreForTest()

        await store
          .getState()
          .loadReaderSettings()

        expect(
          controllerMocks.load,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          store.getState(),
        ).toMatchObject({
          readerSettings:
            settings,

          readerSettingsLoadStatus:
            AsyncStatus.SUCCESS,

          readerSettingsErrorMessage:
            null,
        })
      },
    )

    it(
      'registra erro ao falhar no carregamento',
      async () => {
        controllerMocks.load
          .mockRejectedValue(
            new Error(
              'falha ao carregar configurações',
            ),
          )

        const store =
          createStoreForTest()

        await store
          .getState()
          .loadReaderSettings()

        expect(
          store.getState(),
        ).toMatchObject({
          readerSettingsLoadStatus:
            AsyncStatus.ERROR,

          readerSettingsErrorMessage:
            'falha ao carregar configurações',
        })
      },
    )

    it(
      'salva configurações, encaminha o comando e atualiza o estado',
      async () => {
        const command =
          createSaveCommand()

        const saved =
          createSettings({
            customZoomScale:
              1.25,
          })

        controllerMocks.save
          .mockResolvedValue(
            saved,
          )

        const store =
          createStoreForTest()

        await store
          .getState()
          .saveReaderSettings(
            command,
          )

        expect(
          controllerMocks.save,
        ).toHaveBeenCalledWith(
          command,
        )

        expect(
          store.getState(),
        ).toMatchObject({
          readerSettings:
            saved,

          readerSettingsSaveStatus:
            AsyncStatus.SUCCESS,

          readerSettingsErrorMessage:
            null,
        })
      },
    )

    it(
      'registra erro ao falhar no salvamento',
      async () => {
        controllerMocks.save
          .mockRejectedValue(
            new Error(
              'falha ao salvar configurações',
            ),
          )

        const store =
          createStoreForTest()

        await store
          .getState()
          .saveReaderSettings(
            createSaveCommand(),
          )

        expect(
          store.getState(),
        ).toMatchObject({
          readerSettingsSaveStatus:
            AsyncStatus.ERROR,

          readerSettingsErrorMessage:
            'falha ao salvar configurações',
        })
      },
    )

    it(
      'restaura configurações padrão e atualiza o estado',
      async () => {
        const defaults =
          createSettings()

        controllerMocks.reset
          .mockResolvedValue(
            defaults,
          )

        const store =
          createStoreForTest()

        await store
          .getState()
          .resetReaderSettings()

        expect(
          controllerMocks.reset,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          store.getState(),
        ).toMatchObject({
          readerSettings:
            defaults,

          readerSettingsSaveStatus:
            AsyncStatus.SUCCESS,

          readerSettingsErrorMessage:
            null,
        })
      },
    )

    it(
      'registra erro ao falhar na restauração dos padrões',
      async () => {
        controllerMocks.reset
          .mockRejectedValue(
            new Error(
              'falha ao restaurar padrões',
            ),
          )

        const store =
          createStoreForTest()

        await store
          .getState()
          .resetReaderSettings()

        expect(
          store.getState(),
        ).toMatchObject({
          readerSettingsSaveStatus:
            AsyncStatus.ERROR,

          readerSettingsErrorMessage:
            'falha ao restaurar padrões',
        })
      },
    )

    it(
      'ignora resultado antigo de carregamento depois que um salvamento mais novo termina',
      async () => {
        const deferred =
          createDeferred<ReaderSettings>()

        controllerMocks.load
          .mockReturnValue(
            deferred.promise,
          )

        const saved =
          createSettings({
            customZoomScale:
              1.5,
          })

        controllerMocks.save
          .mockResolvedValue(
            saved,
          )

        const store =
          createStoreForTest()

        const oldLoad =
          store
            .getState()
            .loadReaderSettings()

        await store
          .getState()
          .saveReaderSettings(
            createSaveCommand(),
          )

        deferred.resolve(
          createSettings({
            customZoomScale:
              0.75,
          }),
        )

        await oldLoad

        expect(
          store.getState()
            .readerSettings,
        ).toBe(
          saved,
        )
      },
    )

    it(
      'ignora erro antigo de carregamento quando uma operação mais nova já venceu',
      async () => {
        const deferred =
          createDeferred<ReaderSettings>()

        controllerMocks.load
          .mockReturnValue(
            deferred.promise,
          )

        const saved =
          createSettings()

        controllerMocks.save
          .mockResolvedValue(
            saved,
          )

        const store =
          createStoreForTest()

        const oldLoad =
          store
            .getState()
            .loadReaderSettings()

        await store
          .getState()
          .saveReaderSettings(
            createSaveCommand(),
          )

        deferred.reject(
          new Error(
            'erro antigo',
          ),
        )

        await oldLoad

        expect(
          store.getState()
            .readerSettingsErrorMessage,
        ).toBeNull()

        expect(
          store.getState()
            .readerSettings,
        ).toBe(
          saved,
        )
      },
    )

    it(
      'a operação mais recente entre salvar e restaurar é a única que pode atualizar configurações',
      async () => {
        const deferredSave =
          createDeferred<ReaderSettings>()

        controllerMocks.save
          .mockReturnValue(
            deferredSave.promise,
          )

        const defaults =
          createSettings({
            customZoomScale:
              1,
          })

        controllerMocks.reset
          .mockResolvedValue(
            defaults,
          )

        const store =
          createStoreForTest()

        const oldSave =
          store
            .getState()
            .saveReaderSettings(
              createSaveCommand(),
            )

        await store
          .getState()
          .resetReaderSettings()

        deferredSave.resolve(
          createSettings({
            customZoomScale:
              2,
          }),
        )

        await oldSave

        expect(
          store.getState()
            .readerSettings,
        ).toBe(
          defaults,
        )
      },
    )

    it(
      'limpa a mensagem de erro das configurações',
      () => {
        const store =
          createStoreForTest()

        store.setState({
          readerSettingsErrorMessage:
            'erro anterior',
        } as Partial<AppStore>)

        store
          .getState()
          .clearReaderSettingsError()

        expect(
          store.getState()
            .readerSettingsErrorMessage,
        ).toBeNull()
      },
    )
  },
)

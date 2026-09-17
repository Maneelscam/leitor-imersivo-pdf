const fs=require('node:fs');const path=require('node:path');
const R=p=>fs.readFileSync(path.join(process.cwd(),p),'utf8').replace(/\r\n/g,'\n');
const W=(p,s)=>{const f=path.join(process.cwd(),p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,s,'utf8')};
const N=(p,s)=>{if(fs.existsSync(path.join(process.cwd(),p)))throw new Error('Arquivo já existe: '+p);W(p,s)};
const X=(s,a,b,l)=>{if(!s.includes(a))throw new Error('Trecho não encontrado: '+l);if(s.indexOf(a)!==s.lastIndexOf(a))throw new Error('Trecho duplicado: '+l);return s.replace(a,b)};

N('src/models/enums/LibraryViewMode.ts',`export const LibraryViewMode = {
  GRID: 'grid',
  LIST: 'list',
} as const

export type LibraryViewMode =
  (typeof LibraryViewMode)[keyof typeof LibraryViewMode]

export function isLibraryViewMode(
  value: string,
): value is LibraryViewMode {
  return Object.values(
    LibraryViewMode,
  ).includes(
    value as LibraryViewMode,
  )
}
`);

N('src/services/settings/LibraryViewPreferenceService.ts',`import {
  LibraryViewMode,
  isLibraryViewMode,
  type LibraryViewMode as LibraryViewModeValue,
} from '@/models/enums/LibraryViewMode'

export interface LibraryViewPreferenceStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

const STORAGE_KEY =
  'leitor-imersivo-pdf:library-view-mode'

export class LibraryViewPreferenceService {
  constructor(
    private readonly storage:
      LibraryViewPreferenceStorage | null,
  ) {}

  load(): LibraryViewModeValue {
    if (this.storage === null) {
      return LibraryViewMode.GRID
    }

    try {
      const storedValue =
        this.storage.getItem(STORAGE_KEY)

      return storedValue !== null &&
        isLibraryViewMode(storedValue)
        ? storedValue
        : LibraryViewMode.GRID
    } catch {
      return LibraryViewMode.GRID
    }
  }

  save(viewMode: LibraryViewModeValue): void {
    if (this.storage === null) {
      return
    }

    try {
      this.storage.setItem(
        STORAGE_KEY,
        viewMode,
      )
    } catch {
      // Preferência visual não deve impedir o uso.
    }
  }
}

function createBrowserStorage():
  LibraryViewPreferenceStorage | null {
  if (
    typeof window === 'undefined' ||
    window.localStorage === undefined
  ) {
    return null
  }

  return window.localStorage
}

export const libraryViewPreferenceService =
  new LibraryViewPreferenceService(
    createBrowserStorage(),
  )
`);

N('src/services/settings/LibraryViewPreferenceService.test.ts',`import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  LibraryViewMode,
} from '@/models/enums/LibraryViewMode'
import {
  LibraryViewPreferenceService,
  type LibraryViewPreferenceStorage,
} from '@/services/settings/LibraryViewPreferenceService'

function createStorage(
  initialValue: string | null,
): LibraryViewPreferenceStorage {
  let value = initialValue

  return {
    getItem: vi.fn(() => value),

    setItem: vi.fn(
      (
        _key: string,
        nextValue: string,
      ) => {
        value = nextValue
      },
    ),
  }
}

describe(
  'LibraryViewPreferenceService',
  () => {
    it(
      'usa grade por padrão sem preferência',
      () => {
        const service =
          new LibraryViewPreferenceService(
            createStorage(null),
          )

        expect(service.load()).toBe(
          LibraryViewMode.GRID,
        )
      },
    )

    it(
      'restaura modo lista salvo',
      () => {
        const service =
          new LibraryViewPreferenceService(
            createStorage(
              LibraryViewMode.LIST,
            ),
          )

        expect(service.load()).toBe(
          LibraryViewMode.LIST,
        )
      },
    )

    it(
      'ignora valor inválido',
      () => {
        const service =
          new LibraryViewPreferenceService(
            createStorage('invalido'),
          )

        expect(service.load()).toBe(
          LibraryViewMode.GRID,
        )
      },
    )

    it(
      'salva a preferência',
      () => {
        const storage =
          createStorage(null)

        const service =
          new LibraryViewPreferenceService(
            storage,
          )

        service.save(
          LibraryViewMode.LIST,
        )

        expect(service.load()).toBe(
          LibraryViewMode.LIST,
        )
      },
    )

    it(
      'funciona sem storage',
      () => {
        const service =
          new LibraryViewPreferenceService(
            null,
          )

        expect(service.load()).toBe(
          LibraryViewMode.GRID,
        )

        expect(() => {
          service.save(
            LibraryViewMode.LIST,
          )
        }).not.toThrow()
      },
    )
  },
)
`);

let p='src/features/library/components/LibraryGrid.tsx',s=R(p);
s=X(s,
`import type { LibraryBookItem } from '@/models/dtos/LibraryBookItem'
import type { BookId } from '@/models/value-objects/BookId'
`,
`import type { LibraryBookItem } from '@/models/dtos/LibraryBookItem'
import {
  LibraryViewMode,
  type LibraryViewMode as LibraryViewModeValue,
} from '@/models/enums/LibraryViewMode'
import type { BookId } from '@/models/value-objects/BookId'
`,'grid imports');
s=X(s,`  readonly items: readonly LibraryBookItem[]

  readonly openingBookId?: BookId
`,`  readonly items: readonly LibraryBookItem[]

  readonly viewMode?:
    LibraryViewModeValue

  readonly openingBookId?: BookId
`,'grid prop');
s=X(s,`function createLibraryGridClassName(
  customClassName: string | undefined,
): string {
  const classNames = ['library-grid']
`,`function createLibraryGridClassName(
  viewMode: LibraryViewModeValue,
  customClassName: string | undefined,
): string {
  const classNames = [
    'library-grid',
    \`library-grid--\${viewMode}\`,
  ]
`,'grid class fn');
s=X(s,`export function LibraryGrid({
  items,
  openingBookId,
`,`export function LibraryGrid({
  items,
  viewMode = LibraryViewMode.GRID,
  openingBookId,
`,'grid destructure');
s=X(s,`  const libraryGridClassName =
    createLibraryGridClassName(className)
`,`  const libraryGridClassName =
    createLibraryGridClassName(
      viewMode,
      className,
    )
`,'grid class call');
s=X(s,`            <LibraryBookCard
              item={item}
`,`            <LibraryBookCard
              item={item}
              className={
                viewMode ===
                LibraryViewMode.LIST
                  ? 'library-book-card--list'
                  : undefined
              }
`,'card list class');
W(p,s);

p='src/features/library/components/LibraryToolbar.tsx';s=R(p);
s=X(s,
`import {
  LibrarySortMode,
  type LibrarySortMode as LibrarySortModeValue,
} from '@/models/enums/LibrarySortMode'
`,
`import {
  LibrarySortMode,
  type LibrarySortMode as LibrarySortModeValue,
} from '@/models/enums/LibrarySortMode'
import {
  LibraryViewMode,
  type LibraryViewMode as LibraryViewModeValue,
} from '@/models/enums/LibraryViewMode'
`,'toolbar imports');
s=X(s,`  readonly readingFilter:
    LibraryReadingFilterValue

  readonly searchQuery:
`,`  readonly readingFilter:
    LibraryReadingFilterValue

  readonly viewMode:
    LibraryViewModeValue

  readonly searchQuery:
`,'toolbar view prop');
s=X(s,`  readonly onReadingFilterChange: (
    readingFilter:
      LibraryReadingFilterValue,
  ) => void

  readonly onSortModeChange: (
`,`  readonly onReadingFilterChange: (
    readingFilter:
      LibraryReadingFilterValue,
  ) => void

  readonly onViewModeChange: (
    viewMode: LibraryViewModeValue,
  ) => void

  readonly onSortModeChange: (
`,'toolbar callback');
s=X(s,`function formatBookCount(
`,`function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M9 6h11" />
      <path d="M9 12h11" />
      <path d="M9 18h11" />
      <path d="M4 6h.01" />
      <path d="M4 12h.01" />
      <path d="M4 18h.01" />
    </svg>
  )
}

function formatBookCount(
`,'toolbar icons');
s=X(s,`  sortMode,
  readingFilter,
  searchQuery,
`,`  sortMode,
  readingFilter,
  viewMode,
  searchQuery,
`,'toolbar destructure');
s=X(s,`  onSearchQueryChange,
  onReadingFilterChange,
  onSortModeChange,
`,`  onSearchQueryChange,
  onReadingFilterChange,
  onViewModeChange,
  onSortModeChange,
`,'toolbar callback destructure');
s=X(s,`        <div className="library-toolbar__field">
          <label
            className="library-toolbar__label"
            htmlFor={
              readingFilterSelectId
            }
`,`        <div
          className="library-toolbar__view-toggle"
          role="group"
          aria-label="Modo de visualização da biblioteca"
        >
          <button
            type="button"
            className={
              viewMode === LibraryViewMode.GRID
                ? 'library-toolbar__view-button library-toolbar__view-button--active'
                : 'library-toolbar__view-button'
            }
            disabled={disabled || backupOperationRunning}
            aria-pressed={viewMode === LibraryViewMode.GRID}
            aria-label="Visualizar em grade"
            title="Visualizar em grade"
            onClick={() => {
              onViewModeChange(
                LibraryViewMode.GRID,
              )
            }}
          >
            <GridIcon />
          </button>

          <button
            type="button"
            className={
              viewMode === LibraryViewMode.LIST
                ? 'library-toolbar__view-button library-toolbar__view-button--active'
                : 'library-toolbar__view-button'
            }
            disabled={disabled || backupOperationRunning}
            aria-pressed={viewMode === LibraryViewMode.LIST}
            aria-label="Visualizar em lista"
            title="Visualizar em lista"
            onClick={() => {
              onViewModeChange(
                LibraryViewMode.LIST,
              )
            }}
          >
            <ListIcon />
          </button>
        </div>

        <div className="library-toolbar__field">
          <label
            className="library-toolbar__label"
            htmlFor={
              readingFilterSelectId
            }
`,'toolbar view control');
W(p,s);

p='src/pages/library/LibraryPage.tsx';s=R(p);
s=X(s,
`import {
  LibraryReadingFilter,
  type LibraryReadingFilter as LibraryReadingFilterValue,
} from '@/models/enums/LibraryReadingFilter'
`,
`import {
  LibraryReadingFilter,
  type LibraryReadingFilter as LibraryReadingFilterValue,
} from '@/models/enums/LibraryReadingFilter'
import type {
  LibraryViewMode,
} from '@/models/enums/LibraryViewMode'
`,'page view type');
s=X(s,`import {
  selectClearLibraryBackupError,
`,`import {
  libraryViewPreferenceService,
} from '@/services/settings/LibraryViewPreferenceService'
import {
  selectClearLibraryBackupError,
`,'page view service');
s=X(s,`  const [
    readingFilter,
    setReadingFilter,
  ] = useState<LibraryReadingFilterValue>(
    LibraryReadingFilter.ALL,
  )

  const filteredLibraryItems =
`,`  const [
    readingFilter,
    setReadingFilter,
  ] = useState<LibraryReadingFilterValue>(
    LibraryReadingFilter.ALL,
  )

  const [
    libraryViewMode,
    setLibraryViewMode,
  ] = useState<LibraryViewMode>(
    () =>
      libraryViewPreferenceService.load(),
  )

  const handleLibraryViewModeChange = (
    viewMode: LibraryViewMode,
  ) => {
    setLibraryViewMode(viewMode)
    libraryViewPreferenceService.save(
      viewMode,
    )
  }

  const filteredLibraryItems =
`,'page view state');
s=X(s,`                readingFilter={
                  readingFilter
                }
                sortMode={
`,`                readingFilter={
                  readingFilter
                }
                viewMode={
                  libraryViewMode
                }
                sortMode={
`,'page toolbar view');
s=X(s,`                onReadingFilterChange={
                  setReadingFilter
                }
                onSortModeChange={
`,`                onReadingFilterChange={
                  setReadingFilter
                }
                onViewModeChange={
                  handleLibraryViewModeChange
                }
                onSortModeChange={
`,'page toolbar callback');
s=X(s,`                <LibraryGrid
                  {...gridOptionalProps}
                  items={
`,`                <LibraryGrid
                  {...gridOptionalProps}
                  viewMode={
                    libraryViewMode
                  }
                  items={
`,'page grid view');
W(p,s);

p='src/styles/components/library-grid.css';s=R(p)+`

.library-grid--list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.library-grid--list .library-grid__item {
  width: 100%;
}
`;W(p,s);

p='src/styles/components/library-book-card.css';s=R(p)+`

.library-book-card--list {
  flex-direction: row;
  min-height: 10rem;
}

.library-book-card--list
  .library-book-card__cover-button {
  flex: 0 0 7.5rem;
  width: 7.5rem;
  border-radius:
    var(--radius-xl)
    var(--radius-none)
    var(--radius-none)
    var(--radius-xl);
}

.library-book-card--list
  .library-book-card__cover-frame {
  width: 100%;
  height: 100%;
  min-height: 10rem;
  aspect-ratio: auto;
}

.library-book-card--list
  .library-book-card__body {
  min-height: 10rem;
}

.library-book-card--list
  .library-book-card__progress-overlay {
  right: var(--space-2);
  bottom: var(--space-2);
  left: var(--space-2);
  flex-direction: column;
  align-items: stretch;
  padding: var(--space-2);
}

.library-book-card--list
  .library-book-card__progress-label {
  min-width: 0;
  text-align: left;
}

@media (max-width: 36rem) {
  .library-book-card--list {
    min-height: 8rem;
  }

  .library-book-card--list
    .library-book-card__cover-button {
    flex-basis: 5.5rem;
    width: 5.5rem;
  }

  .library-book-card--list
    .library-book-card__cover-frame,
  .library-book-card--list
    .library-book-card__body {
    min-height: 8rem;
  }
}
`;W(p,s);

p='src/styles/components/library-toolbar.css';s=R(p)+`

.library-toolbar__view-toggle {
  display: inline-flex;
  align-items: center;
  height: var(--control-height-md);
  padding: 0.1875rem;
  background-color: var(--color-background-soft);
  border:
    var(--border-width-thin)
    solid
    var(--color-border-default);
  border-radius: var(--radius-md);
}

.library-toolbar__view-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 100%;
  padding: 0;
  color: var(--color-text-muted);
  background: transparent;
  border-radius: var(--radius-sm);
}

.library-toolbar__view-button > svg {
  width: 1rem;
  height: 1rem;
}

.library-toolbar__view-button:hover:not(:disabled) {
  color: var(--color-text-primary);
  background: var(--color-background-hover);
}

.library-toolbar__view-button--active {
  color: var(--color-accent);
  background: var(--color-accent-soft);
}

.library-toolbar__view-button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 1px;
}

.library-toolbar__view-button:disabled {
  color: var(--color-text-disabled);
  cursor: not-allowed;
}

@media (max-width: 36rem) {
  .library-toolbar__view-toggle {
    align-self: flex-start;
  }
}
`;W(p,s);

console.log('Modo de visualização em grade/lista adicionado com sucesso.');
console.log('A escolha fica salva localmente e é restaurada ao reabrir a biblioteca.');
console.log('Nenhum PDF, progresso ou dado da biblioteca foi alterado.');
console.log('Nenhum commit foi criado.');
try{fs.unlinkSync(__filename);console.log('Script temporário removido automaticamente.')}catch{}

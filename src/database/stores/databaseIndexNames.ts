export const DATABASE_INDEX_NAMES = {
  BOOKS: {
    BY_TITLE: 'byTitle',
    BY_IMPORTED_AT: 'byImportedAt',
    BY_LAST_OPENED_AT: 'byLastOpenedAt',
    BY_PDF_FINGERPRINT: 'byPdfFingerprint',
  },

  BOOKMARKS: {
    BY_BOOK_ID: 'byBookId',
    BY_BOOK_AND_PAGE: 'byBookAndPage',
    BY_CREATED_AT: 'byCreatedAt',
  },

  ANNOTATIONS: {
    BY_BOOK_ID: 'byBookId',
    BY_BOOK_AND_PAGE: 'byBookAndPage',
    BY_CREATED_AT: 'byCreatedAt',
    BY_UPDATED_AT: 'byUpdatedAt',
  },

  COLLECTIONS: {
    BY_NORMALIZED_NAME: 'byNormalizedName',
    BY_CREATED_AT: 'byCreatedAt',
    BY_UPDATED_AT: 'byUpdatedAt',
  },

  COLLECTION_MEMBERSHIPS: {
    BY_COLLECTION_ID: 'byCollectionId',
    BY_BOOK_ID: 'byBookId',
    BY_ADDED_AT: 'byAddedAt',
  },
} as const

export type BooksDatabaseIndexName =
  (typeof DATABASE_INDEX_NAMES.BOOKS)[keyof typeof DATABASE_INDEX_NAMES.BOOKS]

export type BookmarksDatabaseIndexName =
  (typeof DATABASE_INDEX_NAMES.BOOKMARKS)[keyof typeof DATABASE_INDEX_NAMES.BOOKMARKS]

export type AnnotationsDatabaseIndexName =
  (typeof DATABASE_INDEX_NAMES.ANNOTATIONS)[keyof typeof DATABASE_INDEX_NAMES.ANNOTATIONS]

export type CollectionsDatabaseIndexName =
  (typeof DATABASE_INDEX_NAMES.COLLECTIONS)[keyof typeof DATABASE_INDEX_NAMES.COLLECTIONS]

export type CollectionMembershipsDatabaseIndexName =
  (typeof DATABASE_INDEX_NAMES.COLLECTION_MEMBERSHIPS)[keyof typeof DATABASE_INDEX_NAMES.COLLECTION_MEMBERSHIPS]
export const APP_CONFIG = {
  name: 'Hwei',
  shortName: 'Hwei',
  description:
    'Biblioteca e leitor de PDF para leitura focada.',
  version: '1.0.0',

  database: {
    name: 'leitor-imersivo-pdf',
    version: 4,
  },

  pdf: {
    acceptedMimeTypes: [
      'application/pdf',
    ],

    acceptedExtensions: [
      '.pdf',
    ],
  },
} as const

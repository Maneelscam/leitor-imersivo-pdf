export const APP_CONFIG = {
  name: 'Leitor Imersivo de PDF',
  shortName: 'Leitor Imersivo',
  description:
    'Leitor de PDF moderno, rápido e totalmente local.',
  version: '0.1.0',

  database: {
    name: 'leitor-imersivo-pdf',
    version: 3,
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
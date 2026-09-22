import {
  AppRoute,
  type AppRoute as AppRouteValue,
} from '@/app/routes/AppRoute'

export interface AppRouteMetadata {
  readonly eyebrow: string
  readonly title: string
  readonly description: string

  readonly readerMode: boolean}

export const APP_ROUTE_METADATA: Readonly<
  Record<AppRouteValue, AppRouteMetadata>
> = {
  [AppRoute.LIBRARY]: {
    eyebrow: 'Coleção',
    title: 'Biblioteca',
    description:
      'Importe, organize e continue a leitura dos seus PDFs.',
    readerMode: false,  },

  [AppRoute.READER]: {
    eyebrow: 'Leitura',
    title: 'Leitura',
    description:
      'Leia com foco, conforto e progresso salvo automaticamente.',
    readerMode: true,  },

  [AppRoute.SETTINGS]: {
    eyebrow: 'Preferências',
    title: 'Configurações',
    description:
      'Personalize a exibição, a navegação e os controles de leitura.',
    readerMode: false,  },
}

export function getAppRouteMetadata(
  route: AppRouteValue,
): AppRouteMetadata {
  return APP_ROUTE_METADATA[route]
}
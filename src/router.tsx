import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import { JavaScriptFieldRoute } from './field/JavaScriptFieldRoute'
import { TypeScriptFieldRoute } from './field/TypeScriptFieldRoute'
import { RootLayout } from './RootLayout'
import { BattleRoutePage, HomePage, TypeScriptBattleRoutePage } from './routeComponents'
import { WorldPage } from './world/WorldPage'

const rootRoute = createRootRoute({ component: RootLayout })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const worldRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'world',
  component: WorldPage,
})

const javascriptRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'javascript',
  beforeLoad: () => {
    throw redirect({ to: '/world' })
  },
})

const javascriptFieldRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'javascript/field',
  component: JavaScriptFieldRoute,
})

const javascriptBattleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'javascript/battle/$battleId',
  validateSearch: (search: Record<string, unknown>) => ({
    seed: typeof search.seed === 'string' && search.seed.length > 0 ? search.seed : undefined,
    returnTo: search.returnTo === '/javascript/field' ? '/javascript/field' as const : undefined,
  }),
  component: BattleRoutePage,
})

const javascriptCompleteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'javascript/complete',
  beforeLoad: () => {
    throw redirect({ to: '/world' })
  },
})

const typescriptRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'typescript',
  beforeLoad: () => {
    throw redirect({ to: '/world' })
  },
})

const typescriptFieldRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'typescript/field',
  component: TypeScriptFieldRoute,
})

const typescriptBattleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'typescript/battle/$battleId',
  validateSearch: (search: Record<string, unknown>) => ({
    seed: typeof search.seed === 'string' && search.seed.length > 0 ? search.seed : undefined,
    returnTo: search.returnTo === '/typescript/field' ? '/typescript/field' as const : undefined,
  }),
  component: TypeScriptBattleRoutePage,
})

const typescriptCompleteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'typescript/complete',
  beforeLoad: () => {
    throw redirect({ to: '/world' })
  },
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  worldRoute,
  javascriptRoute,
  javascriptFieldRoute,
  javascriptBattleRoute,
  javascriptCompleteRoute,
  typescriptRoute,
  typescriptFieldRoute,
  typescriptBattleRoute,
  typescriptCompleteRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

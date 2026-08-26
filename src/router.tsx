import { Outlet, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { JavaScriptFieldRoute } from './field/JavaScriptFieldRoute'
import { BattleRoutePage, CompletePage, HomePage, JavaScriptAreaPage } from './routeComponents'
import { WorldPage } from './world/WorldPage'

const rootRoute = createRootRoute({
  component: Outlet,
})

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
  component: JavaScriptAreaPage,
})

const fieldRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'javascript/field',
  component: JavaScriptFieldRoute,
})

const battleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'javascript/battle/$battleId',
  validateSearch: (search: Record<string, unknown>) => ({
    seed: typeof search.seed === 'string' && search.seed.length > 0 ? search.seed : undefined,
    returnTo: search.returnTo === '/javascript/field' ? '/javascript/field' as const : undefined,
  }),
  component: BattleRoutePage,
})

const completeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'javascript/complete',
  component: CompletePage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  worldRoute,
  javascriptRoute,
  fieldRoute,
  battleRoute,
  completeRoute,
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

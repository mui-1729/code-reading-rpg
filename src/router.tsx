import { Outlet, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { BattleRoutePage, CompletePage, HomePage, JavaScriptAreaPage } from './routeComponents'

const rootRoute = createRootRoute({
  component: Outlet,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const javascriptRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'javascript',
  component: JavaScriptAreaPage,
})

const battleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'javascript/battle/$battleId',
  validateSearch: (search: Record<string, unknown>) => ({
    seed: typeof search.seed === 'string' && search.seed.length > 0 ? search.seed : undefined,
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
  javascriptRoute,
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

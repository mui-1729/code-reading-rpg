import { Outlet, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { JavaScriptFieldRoute } from './field/JavaScriptFieldRoute'
import { TypeScriptFieldRoute } from './field/TypeScriptFieldRoute'
import { QuestTracker } from './quests/QuestTracker'
import {
  BattleRoutePage,
  CompletePage,
  HomePage,
  JavaScriptAreaPage,
  TypeScriptAreaPage,
  TypeScriptBattleRoutePage,
  TypeScriptCompletePage,
} from './routeComponents'
import { WorldPage } from './world/WorldPage'

function RootLayout() {
  return (
    <>
      <Outlet />
      <QuestTracker />
    </>
  )
}

const rootRoute = createRootRoute({
  component: RootLayout,
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
  component: CompletePage,
})

const typescriptRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'typescript',
  component: TypeScriptAreaPage,
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
  component: TypeScriptCompletePage,
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

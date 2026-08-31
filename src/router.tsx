import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import { RootLayout } from './RootLayout'
import { BattleRoutePage, HomePage } from './routeComponents'
import { validateBattleSearch } from './battle/session'
import { WorldRoutePage } from './world/WorldRoutePage'

const rootRoute = createRootRoute({ component: RootLayout })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const worldRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'world',
  component: WorldRoutePage,
})

const javascriptRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'javascript',
  beforeLoad: () => { throw redirect({ to: '/world' }) },
})

const javascriptFieldRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'javascript/field',
  beforeLoad: () => { throw redirect({ to: '/world' }) },
})

const javascriptBattleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'javascript/battle/$battleId',
  validateSearch: validateBattleSearch,
  component: BattleRoutePage,
})

const javascriptCompleteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'javascript/complete',
  beforeLoad: () => { throw redirect({ to: '/world' }) },
})

const typescriptRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'typescript',
  beforeLoad: () => { throw redirect({ to: '/world' }) },
})

const typescriptFieldRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'typescript/field',
  beforeLoad: () => { throw redirect({ to: '/world' }) },
})

const typescriptBattleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'typescript/battle/$battleId',
  validateSearch: validateBattleSearch,
  component: BattleRoutePage,
})

const typescriptCompleteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'typescript/complete',
  beforeLoad: () => { throw redirect({ to: '/world' }) },
})

// New registered Areas use the same adapter without adding another route component.
const registeredBattleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '$areaId/battle/$battleId',
  validateSearch: validateBattleSearch,
  component: BattleRoutePage,
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
  registeredBattleRoute,
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

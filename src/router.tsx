import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from '@tanstack/react-router'
import App from './App'
import { battles } from './game'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const battleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'javascript/battle/$battleId',
  component: BattleRoutePage,
})

const completeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'javascript/complete',
  component: CompletePage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
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

export function AppRouter() {
  return <RouterProvider router={router} />
}

function HomePage() {
  const navigate = useNavigate()

  return (
    <main className="app-shell intro-shell">
      <section className="hero-panel">
        <div className="eyebrow">JAVASCRIPT // CHAPTER 01</div>
        <h1>CODE<span>//</span>READ RPG</h1>
        <p className="hero-copy">
          技の説明はない。コードを読めば、誰に当たるかが分かる。
        </p>
        <div className="rule-grid">
          <div><strong>01</strong><span>敵とNEXT行動を見る</span></div>
          <div><strong>02</strong><span>コードから対象を読む</span></div>
          <div><strong>03</strong><span>同じカードを2回押して発動</span></div>
        </div>
        <button
          className="primary-button"
          onClick={() =>
            navigate({
              to: '/javascript/battle/$battleId',
              params: { battleId: '1' },
            })
          }
        >
          START RUN
        </button>
      </section>
    </main>
  )
}

function BattleRoutePage() {
  const { battleId } = battleRoute.useParams()
  const numericBattleId = Number(battleId)
  const exists = battles.some((battle) => battle.id === numericBattleId)

  if (!exists) {
    return <NotFoundBattle />
  }

  return <App key={battleId} battleId={numericBattleId} />
}

function CompletePage() {
  const navigate = useNavigate()

  return (
    <main className="app-shell center-shell">
      <section className="result-card complete-card">
        <div className="eyebrow">CHAPTER CLEAR</div>
        <h2>JavaScript // MVP COMPLETE</h2>
        <p>3つの戦闘をクリアした。次はカード、敵、そして読むコード自体を増やせる。</p>
        <button className="primary-button" onClick={() => navigate({ to: '/' })}>
          PLAY AGAIN
        </button>
      </section>
    </main>
  )
}

function NotFoundBattle() {
  const navigate = useNavigate()

  return (
    <main className="app-shell center-shell">
      <section className="result-card defeat-card">
        <div className="eyebrow">ROUTE ERROR</div>
        <h2>そのBattleは存在しない</h2>
        <p>Battle 1〜3のURLを指定してください。</p>
        <button className="primary-button" onClick={() => navigate({ to: '/' })}>
          BACK TO START
        </button>
      </section>
    </main>
  )
}

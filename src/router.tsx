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
    <main className="app-shell intro-shell title-screen">
      <div className="crt-overlay" aria-hidden="true" />
      <section className="title-stage pixel-window">
        <div className="title-sky" aria-hidden="true">
          <span className="star star-a">+</span>
          <span className="star star-b">.</span>
          <span className="star star-c">*</span>
          <span className="star star-d">+</span>
          <span className="moon">C</span>
        </div>

        <div className="title-copy">
          <div className="chapter-label">JAVASCRIPT // CHAPTER 01</div>
          <h1 className="pixel-logo">
            <span>CODE</span><b>//</b><span>READ</span>
            <em>RPG</em>
          </h1>
          <p className="title-tagline">READ CODE. CHOOSE FATE.</p>
        </div>

        <div className="title-landscape" aria-hidden="true">
          <div className="pixel-castle" />
          <div className="pixel-mountains" />
          <div className="pixel-hero"><span className="hero-sword" /></div>
          <div className="pixel-slime" />
        </div>

        <div className="title-menu pixel-window inner-window">
          <button
            className="menu-button selected-menu"
            onClick={() =>
              navigate({
                to: '/javascript/battle/$battleId',
                params: { battleId: '1' },
              })
            }
          >
            <span className="menu-cursor">▶</span>
            START RUN
          </button>
          <div className="menu-note">技の説明はない。コードを読んで、戦況を選べ。</div>
        </div>

        <div className="how-to-grid" aria-label="How to play">
          <div><strong>01</strong><span>敵のHPとNEXT行動を見る</span></div>
          <div><strong>02</strong><span>コードが選ぶ対象を読む</span></div>
          <div><strong>03</strong><span>同じカードを2回押して発動</span></div>
        </div>
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
    <main className="app-shell center-shell result-screen">
      <div className="crt-overlay" aria-hidden="true" />
      <section className="result-card complete-card pixel-window">
        <div className="chapter-label">CHAPTER CLEAR</div>
        <div className="result-rune" aria-hidden="true">✦</div>
        <h2>JAVASCRIPT<br />MVP COMPLETE</h2>
        <p>3つの戦闘をクリアした。次の章では、もっと複雑なコードを読む。</p>
        <button className="primary-button" onClick={() => navigate({ to: '/' })}>
          ▶ PLAY AGAIN
        </button>
      </section>
    </main>
  )
}

function NotFoundBattle() {
  const navigate = useNavigate()

  return (
    <main className="app-shell center-shell result-screen">
      <div className="crt-overlay" aria-hidden="true" />
      <section className="result-card defeat-card pixel-window">
        <div className="chapter-label danger-label">ROUTE ERROR</div>
        <h2>そのBATTLEは存在しない</h2>
        <p>Battle 1〜3のURLを指定してください。</p>
        <button className="primary-button" onClick={() => navigate({ to: '/' })}>
          ◀ BACK TO START
        </button>
      </section>
    </main>
  )
}

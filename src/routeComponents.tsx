import { getRouteApi, useNavigate } from '@tanstack/react-router'
import App from './App'
import { battles } from './game'

const battleRouteApi = getRouteApi('/javascript/battle/$battleId')

export function HomePage() {
  const navigate = useNavigate()

  return (
    <main className="app-shell intro-shell title-screen">
      <section className="hero-panel pixel-window title-window">
        <div className="title-stars" aria-hidden="true">✦ · ✧ · ✦</div>
        <div className="eyebrow">JAVASCRIPT // CHAPTER 01</div>
        <h1>CODE<span>//</span>READ <em>RPG</em></h1>
        <p className="hero-copy">
          技の説明はない。コードを読んで、戦況を変えろ。
        </p>

        <div className="title-scene" aria-hidden="true">
          <div className="pixel-moon" />
          <div className="pixel-mountains mountain-left" />
          <div className="pixel-mountains mountain-right" />
          <div className="player-sprite title-player"><span /></div>
          <div className="enemy-sprite slime title-slime"><span className="sprite-face">··</span></div>
          <div className="ground-strip" />
        </div>

        <nav className="title-menu" aria-label="Title menu">
          <button
            className="primary-button menu-button"
            onClick={() =>
              navigate({
                to: '/javascript/battle/$battleId',
                params: { battleId: '1' },
              })
            }
          >
            <span aria-hidden="true">▶</span> START RUN
          </button>
          <a className="secondary-button menu-button" href="#how-to-play">
            HOW TO PLAY
          </a>
        </nav>

        <div className="rule-grid" id="how-to-play">
          <div><strong>01</strong><span>敵とNEXT行動を見る</span></div>
          <div><strong>02</strong><span>コードから対象を読む</span></div>
          <div><strong>03</strong><span>同じカードを2回押して発動</span></div>
        </div>

        <div className="title-footer">8-BIT CODE READING SYSTEM // MVP</div>
      </section>
    </main>
  )
}

export function BattleRoutePage() {
  const { battleId } = battleRouteApi.useParams()
  const numericBattleId = Number(battleId)
  const exists = battles.some((battle) => battle.id === numericBattleId)

  if (!exists) {
    return <NotFoundBattle />
  }

  return <App key={battleId} battleId={numericBattleId} />
}

export function CompletePage() {
  const navigate = useNavigate()

  return (
    <main className="app-shell center-shell title-screen">
      <section className="result-card complete-card pixel-window">
        <div className="eyebrow">CHAPTER CLEAR</div>
        <h2>JavaScript // MVP COMPLETE</h2>
        <p>3つの戦闘をクリアした。次はカード、敵、そして読むコード自体を増やせる。</p>
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
    <main className="app-shell center-shell title-screen">
      <section className="result-card defeat-card pixel-window">
        <div className="eyebrow">ROUTE ERROR</div>
        <h2>そのBattleは存在しない</h2>
        <p>Battle 1〜3のURLを指定してください。</p>
        <button className="primary-button" onClick={() => navigate({ to: '/' })}>
          ◀ BACK TO START
        </button>
      </section>
    </main>
  )
}

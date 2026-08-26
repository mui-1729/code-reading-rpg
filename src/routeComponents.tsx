import { useEffect, useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import App from './App'
import { areaById, battles, JAVASCRIPT_AREA_ID } from './game'
import { getTotalExpForLevel, useProgress } from './progression'

const battleRouteApi = getRouteApi('/javascript/battle/$battleId')
const createRunSeed = () => crypto.randomUUID()

export function HomePage() {
  const navigate = useNavigate()

  return (
    <main className="app-shell intro-shell title-screen">
      <section className="hero-panel pixel-window title-window">
        <div className="title-stars" aria-hidden="true">✦ · ✧ · ✦</div>
        <div className="eyebrow">JAVASCRIPT // CHAPTER 01</div>
        <h1>
          CODE<span>//</span>READ <em>RPG</em>
        </h1>
        <p className="hero-copy">技の説明はない。コードを読んで、戦況を変えろ。</p>

        <div className="title-scene" aria-hidden="true">
          <div className="pixel-moon" />
          <div className="pixel-mountains mountain-left" />
          <div className="pixel-mountains mountain-right" />
          <div className="player-sprite title-player">
            <span />
          </div>
          <div className="enemy-sprite slime title-slime">
            <span className="sprite-face">··</span>
          </div>
          <div className="ground-strip" />
        </div>

        <nav className="title-menu" aria-label="Title menu">
          <button className="primary-button menu-button" onClick={() => navigate({ to: '/javascript' })}>
            <span aria-hidden="true">▶</span> START RUN
          </button>
          <a className="secondary-button menu-button" href="#how-to-play">
            HOW TO PLAY
          </a>
        </nav>

        <div className="rule-grid" id="how-to-play">
          <div>
            <strong>01</strong>
            <span>敵とNEXT行動を見る</span>
          </div>
          <div>
            <strong>02</strong>
            <span>コードから対象を読む</span>
          </div>
          <div>
            <strong>03</strong>
            <span>同じカードを2回押して発動</span>
          </div>
        </div>

        <div className="title-footer">8-BIT CODE READING SYSTEM // MVP</div>
      </section>
    </main>
  )
}

export function JavaScriptAreaPage() {
  const navigate = useNavigate()
  const { progress, stats, resetProgress } = useProgress()
  const area = areaById[JAVASCRIPT_AREA_ID]
  const areaCleared = progress.clearedAreaIds.includes(area.id)
  const areaBattles = battles.filter((battle) => battle.areaId === area.id)
  const levelStartExp = getTotalExpForLevel(stats.level)
  const nextLevelExp = getTotalExpForLevel(stats.level + 1)
  const expInLevel = progress.exp - levelStartExp
  const expRange = Math.max(1, nextLevelExp - levelStartExp)
  const expPercent = Math.max(0, Math.min(100, (expInLevel / expRange) * 100))

  const handleResetProgress = () => {
    const confirmed = window.confirm(
      '進行状況を初期化します。EXP・Stage CLEAR・Area CLEAR・Skill解放は元に戻せません。',
    )
    if (!confirmed) return
    resetProgress()
  }

  return (
    <main className="app-shell area-shell title-screen">
      <section className="pixel-window area-panel">
        <header className="area-header">
          <div>
            <div className="eyebrow">{area.label} // JAVASCRIPT KINGDOM</div>
            <h1>{area.title}</h1>
            <p>コードを読み、敵を倒して王国の奥へ進め。</p>
            {areaCleared && <div className="area-clear-badge">✓ AREA CLEAR</div>}
          </div>
          <button className="secondary-button area-back" onClick={() => navigate({ to: '/' })}>
            ◀ TITLE
          </button>
        </header>

        <section className="player-progress-panel pixel-inner-window" aria-label="Player progress">
          <div className="progress-stat">
            <span>LEVEL</span>
            <strong>{stats.level}</strong>
          </div>
          <div className="progress-stat">
            <span>MAX HP</span>
            <strong>{stats.maxHp}</strong>
          </div>
          <div className="progress-exp">
            <div className="progress-exp-label">
              <span>EXP</span>
              <strong>{progress.exp} / {nextLevelExp}</strong>
            </div>
            <div className="area-exp-track" aria-label={`EXP ${progress.exp} / ${nextLevelExp}`}>
              <div className="area-exp-fill" style={{ width: `${expPercent}%` }} />
            </div>
          </div>
        </section>

        <div className="area-route-label">SELECT STAGE</div>
        <section className="stage-path" aria-label="JavaScript stages">
          {areaBattles.map((battle) => {
            const unlocked = progress.unlockedStageIds.includes(battle.id)
            const cleared = progress.clearedStageIds.includes(battle.id)
            const state = cleared ? 'CLEAR' : unlocked ? 'READY' : 'LOCKED'

            return (
              <article
                className={`stage-node pixel-inner-window ${unlocked ? 'is-unlocked' : 'is-locked'} ${cleared ? 'is-cleared' : ''} ${battle.isBoss ? 'is-boss' : ''}`}
                key={battle.id}
              >
                <div className="stage-node-topline">
                  <span>{battle.label}</span>
                  <strong>{battle.isBoss ? `${state} · BOSS` : state}</strong>
                </div>
                <h2>{battle.title}</h2>
                <p>{battle.subtitle}</p>
                <dl className="stage-meta">
                  <div>
                    <dt>RECOMMENDED</dt>
                    <dd>LV {battle.recommendedLevel}</dd>
                  </div>
                  <div>
                    <dt>REWARD</dt>
                    <dd>EXP +{battle.expReward}</dd>
                  </div>
                </dl>
                <div className={`stage-state stage-state-${state.toLowerCase()}`}>{state}</div>
                <button
                  className="primary-button stage-enter"
                  disabled={!unlocked}
                  onClick={() =>
                    navigate({
                      to: '/javascript/battle/$battleId',
                      params: { battleId: String(battle.id) },
                      search: { seed: createRunSeed() },
                    })
                  }
                >
                  {unlocked ? (cleared ? '▶ REPLAY' : '▶ ENTER') : '■ LOCKED'}
                </button>
              </article>
            )
          })}
        </section>

        <footer className="area-footer">
          <span>
            解放済みStageには何度でも挑戦できる。勝てない敵が現れたら、前のStageで力をつけて戻ってこよう。
          </span>
          <button type="button" className="secondary-button area-reset" onClick={handleResetProgress}>
            RESET PROGRESS
          </button>
        </footer>
      </section>
    </main>
  )
}

export function BattleRoutePage() {
  const { battleId } = battleRouteApi.useParams()
  const { seed: searchSeed } = battleRouteApi.useSearch()
  const navigate = useNavigate()
  const [fallbackSeed] = useState(createRunSeed)
  const seed = searchSeed ?? fallbackSeed
  const numericBattleId = Number(battleId)
  const exists = battles.some((battle) => battle.id === numericBattleId)

  useEffect(() => {
    if (searchSeed || !exists) return

    navigate({
      to: '/javascript/battle/$battleId',
      params: { battleId },
      search: { seed },
      replace: true,
    })
  }, [battleId, exists, navigate, searchSeed, seed])

  if (!exists) {
    return <NotFoundBattle />
  }

  return <App key={`${battleId}:${seed}`} battleId={numericBattleId} seed={seed} />
}

export function CompletePage() {
  const navigate = useNavigate()
  const { progress } = useProgress()
  const area = areaById[JAVASCRIPT_AREA_ID]
  const areaCleared = progress.clearedAreaIds.includes(area.id)
  const boss = battles.find((battle) => battle.id === area.bossBattleId)

  const replayBoss = () => {
    if (!boss) return
    navigate({
      to: '/javascript/battle/$battleId',
      params: { battleId: String(boss.id) },
      search: { seed: createRunSeed() },
    })
  }

  return (
    <main className="app-shell center-shell title-screen">
      <section className="result-card complete-card pixel-window">
        <div className="eyebrow">{areaCleared ? 'AREA CLEAR' : 'AREA STATUS'}</div>
        <h2>{areaCleared ? `${area.title} CLEAR` : 'BOSS NOT CLEARED'}</h2>
        <p>
          {areaCleared
            ? '王国のBossを倒した。CLEAR後もStage Selectへ戻り、過去StageやBossへ何度でも再挑戦できる。'
            : 'この画面はBoss初回クリア後に解放される。Stage Selectへ戻って王国を攻略しよう。'}
        </p>
        <div className="result-actions">
          <button className="primary-button" onClick={() => navigate({ to: '/javascript' })}>
            ◀ BACK TO KINGDOM
          </button>
          {areaCleared && boss && (
            <button className="secondary-button" onClick={replayBoss}>
              ▶ REPLAY BOSS
            </button>
          )}
        </div>
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
        <button className="primary-button" onClick={() => navigate({ to: '/javascript' })}>
          ◀ BACK TO KINGDOM
        </button>
      </section>
    </main>
  )
}

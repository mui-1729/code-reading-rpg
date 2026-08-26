import { useEffect, useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import App from './App'
import { useBgm } from './audio/useBgm'
import {
  areaById,
  getAreaForBattle,
  getBattlesForArea,
  getBossBattleForArea,
  JAVASCRIPT_AREA_ID,
  TYPESCRIPT_AREA_ID,
} from './game'
import { getTotalExpForLevel, useProgress } from './progression'

const javascriptBattleRouteApi = getRouteApi('/javascript/battle/$battleId')
const typescriptBattleRouteApi = getRouteApi('/typescript/battle/$battleId')
const createRunSeed = () => crypto.randomUUID()

type SupportedAreaId = typeof JAVASCRIPT_AREA_ID | typeof TYPESCRIPT_AREA_ID

type AreaStageSelectProps = {
  areaId: SupportedAreaId
  eyebrow: string
  intro: string
  onEnterBattle: (battleId: number) => void
}

type AreaCompleteProps = {
  areaId: SupportedAreaId
  onReplayBoss: (bossId: number) => void
}

export function HomePage() {
  const navigate = useNavigate()
  useBgm('menu')

  return (
    <main className="app-shell intro-shell title-screen">
      <section className="hero-panel pixel-window title-window">
        <div className="title-stars" aria-hidden="true">✦ · ✧ · ✦</div>
        <div className="eyebrow">JAVASCRIPT + TYPESCRIPT // CODE READING</div>
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
          <button className="primary-button menu-button" onClick={() => navigate({ to: '/world' })}>
            <span aria-hidden="true">▶</span> START RUN
          </button>
          <a className="secondary-button menu-button" href="#how-to-play">
            HOW TO PLAY
          </a>
        </nav>

        <div className="rule-grid" id="how-to-play">
          <div>
            <strong>01</strong>
            <span>World MapからAreaを選び、フィールドを探索する</span>
          </div>
          <div>
            <strong>02</strong>
            <span>看板で構文を確認し、Battleではコードから対象を読む</span>
          </div>
          <div>
            <strong>03</strong>
            <span>勝利して成長し、複数行・複数概念のBossへ進む</span>
          </div>
        </div>

        <div className="title-footer">8-BIT CODE READING SYSTEM // RPG LOOP</div>
      </section>
    </main>
  )
}

function AreaStageSelectPage({ areaId, eyebrow, intro, onEnterBattle }: AreaStageSelectProps) {
  const navigate = useNavigate()
  const { progress, stats, resetProgress } = useProgress()
  useBgm('menu')

  const area = areaById[areaId]
  const areaCleared = progress.clearedAreaIds.includes(area.id)
  const areaBattles = getBattlesForArea(area.id)
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
            <div className="eyebrow">{area.label} // {eyebrow}</div>
            <h1>{area.title}</h1>
            <p>{intro}</p>
            {areaCleared && <div className="area-clear-badge">✓ AREA CLEAR</div>}
          </div>
          <div className="area-header-actions">
            <button
              className="primary-button area-back"
              disabled={!area.routes.field}
              onClick={() => area.routes.field && navigate({ to: area.routes.field })}
            >
              ▶ EXPLORE FIELD
            </button>
            <button className="secondary-button area-back" onClick={() => navigate({ to: '/world' })}>
              ◀ WORLD MAP
            </button>
          </div>
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
        <section className="stage-path" aria-label={`${area.title} stages`}>
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
                  onClick={() => onEnterBattle(battle.id)}
                >
                  {unlocked ? (cleared ? '▶ REPLAY' : '▶ ENTER') : '■ LOCKED'}
                </button>
              </article>
            )
          })}
        </section>

        <footer className="area-footer">
          <span>
            Stage Selectは進行確認・再挑戦用。通常の冒険はFIELDからBattle Gateへ向かえる。
          </span>
          <button type="button" className="secondary-button area-reset" onClick={handleResetProgress}>
            RESET PROGRESS
          </button>
        </footer>
      </section>
    </main>
  )
}

export function JavaScriptAreaPage() {
  const navigate = useNavigate()

  return (
    <AreaStageSelectPage
      areaId={JAVASCRIPT_AREA_ID}
      eyebrow="JAVASCRIPT KINGDOM"
      intro="コードを読み、敵を倒して王国の奥へ進め。"
      onEnterBattle={(battleId) =>
        navigate({
          to: '/javascript/battle/$battleId',
          params: { battleId: String(battleId) },
          search: { seed: createRunSeed(), returnTo: undefined },
        })
      }
    />
  )
}

export function TypeScriptAreaPage() {
  const navigate = useNavigate()

  return (
    <AreaStageSelectPage
      areaId={TYPESCRIPT_AREA_ID}
      eyebrow="TYPESCRIPT FRONTIER"
      intro="型情報を手がかりにコードを追い、辺境のCompiler Bossへ進め。"
      onEnterBattle={(battleId) =>
        navigate({
          to: '/typescript/battle/$battleId',
          params: { battleId: String(battleId) },
          search: { seed: createRunSeed(), returnTo: undefined },
        })
      }
    />
  )
}

export function BattleRoutePage() {
  const { battleId } = javascriptBattleRouteApi.useParams()
  const { seed: searchSeed, returnTo } = javascriptBattleRouteApi.useSearch()
  const navigate = useNavigate()
  const [fallbackSeed] = useState(createRunSeed)
  const seed = searchSeed ?? fallbackSeed
  const numericBattleId = Number(battleId)
  const battleArea = getAreaForBattle(numericBattleId)
  const exists = battleArea?.id === JAVASCRIPT_AREA_ID

  useEffect(() => {
    if (searchSeed || !exists) return

    navigate({
      to: '/javascript/battle/$battleId',
      params: { battleId },
      search: { seed, returnTo },
      replace: true,
    })
  }, [battleId, exists, navigate, returnTo, searchSeed, seed])

  if (!exists) return <NotFoundBattle areaId={JAVASCRIPT_AREA_ID} />

  return (
    <App
      key={`${battleId}:${seed}`}
      battleId={numericBattleId}
      seed={seed}
      returnTo={returnTo}
    />
  )
}

export function TypeScriptBattleRoutePage() {
  const { battleId } = typescriptBattleRouteApi.useParams()
  const { seed: searchSeed, returnTo } = typescriptBattleRouteApi.useSearch()
  const navigate = useNavigate()
  const [fallbackSeed] = useState(createRunSeed)
  const seed = searchSeed ?? fallbackSeed
  const numericBattleId = Number(battleId)
  const battleArea = getAreaForBattle(numericBattleId)
  const exists = battleArea?.id === TYPESCRIPT_AREA_ID

  useEffect(() => {
    if (searchSeed || !exists) return

    navigate({
      to: '/typescript/battle/$battleId',
      params: { battleId },
      search: { seed, returnTo },
      replace: true,
    })
  }, [battleId, exists, navigate, returnTo, searchSeed, seed])

  if (!exists) return <NotFoundBattle areaId={TYPESCRIPT_AREA_ID} />

  return (
    <App
      key={`${battleId}:${seed}`}
      battleId={numericBattleId}
      seed={seed}
      returnTo={returnTo}
    />
  )
}

function AreaCompletePage({ areaId, onReplayBoss }: AreaCompleteProps) {
  const navigate = useNavigate()
  const { progress } = useProgress()
  useBgm('menu')

  const area = areaById[areaId]
  const areaCleared = progress.clearedAreaIds.includes(area.id)
  const boss = getBossBattleForArea(area.id)
  const fieldPath = area.routes.field
  const stageSelectPath = area.routes.stageSelect

  return (
    <main className="app-shell center-shell title-screen">
      <section className="result-card complete-card pixel-window">
        <div className="eyebrow">{areaCleared ? 'AREA CLEAR' : 'AREA STATUS'}</div>
        <h2>{areaCleared ? `${area.title} CLEAR` : 'BOSS NOT CLEARED'}</h2>
        <p>
          {areaCleared
            ? `${area.title}のBossを倒した。World Mapへ戻るか、フィールドやStage Selectから過去Battleへ再挑戦できる。`
            : `この画面はBoss初回クリア後に解放される。フィールドへ戻って${area.title}を攻略しよう。`}
        </p>
        <div className="result-actions">
          <button className="primary-button" onClick={() => navigate({ to: '/world' })}>
            ◀ WORLD MAP
          </button>
          <button
            className="secondary-button"
            disabled={!fieldPath}
            onClick={() => fieldPath && navigate({ to: fieldPath })}
          >
            RETURN TO FIELD
          </button>
          <button
            className="secondary-button"
            disabled={!stageSelectPath}
            onClick={() => stageSelectPath && navigate({ to: stageSelectPath })}
          >
            STAGE SELECT
          </button>
          {areaCleared && boss && (
            <button className="secondary-button" onClick={() => onReplayBoss(boss.id)}>
              ▶ REPLAY BOSS
            </button>
          )}
        </div>
      </section>
    </main>
  )
}

export function CompletePage() {
  const navigate = useNavigate()

  return (
    <AreaCompletePage
      areaId={JAVASCRIPT_AREA_ID}
      onReplayBoss={(bossId) =>
        navigate({
          to: '/javascript/battle/$battleId',
          params: { battleId: String(bossId) },
          search: { seed: createRunSeed(), returnTo: '/javascript/field' },
        })
      }
    />
  )
}

export function TypeScriptCompletePage() {
  const navigate = useNavigate()

  return (
    <AreaCompletePage
      areaId={TYPESCRIPT_AREA_ID}
      onReplayBoss={(bossId) =>
        navigate({
          to: '/typescript/battle/$battleId',
          params: { battleId: String(bossId) },
          search: { seed: createRunSeed(), returnTo: '/typescript/field' },
        })
      }
    />
  )
}

function NotFoundBattle({ areaId }: { areaId: SupportedAreaId }) {
  const navigate = useNavigate()
  useBgm('menu')
  const area = areaById[areaId]
  const fieldPath = area.routes.field

  return (
    <main className="app-shell center-shell title-screen">
      <section className="result-card defeat-card pixel-window">
        <div className="eyebrow">ROUTE ERROR</div>
        <h2>そのBattleはこのAreaに存在しない</h2>
        <p>{area.title}のBattle URLを指定してください。</p>
        <button
          className="primary-button"
          disabled={!fieldPath}
          onClick={() => fieldPath && navigate({ to: fieldPath })}
        >
          ◀ RETURN TO FIELD
        </button>
      </section>
    </main>
  )
}

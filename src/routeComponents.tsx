import { useEffect, useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import App from './App'
import { useBgm } from './audio/useBgm'
import {
  areaById,
  getAreaForBattle,
  JAVASCRIPT_AREA_ID,
  TYPESCRIPT_AREA_ID,
} from './game'

const javascriptBattleRouteApi = getRouteApi('/javascript/battle/$battleId')
const typescriptBattleRouteApi = getRouteApi('/typescript/battle/$battleId')
const createRunSeed = () => crypto.randomUUID()

type SupportedAreaId = typeof JAVASCRIPT_AREA_ID | typeof TYPESCRIPT_AREA_ID

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
        </nav>

        <div className="title-footer">8-BIT CODE READING SYSTEM // RPG LOOP</div>
      </section>
    </main>
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

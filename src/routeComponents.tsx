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
import {
  JAVASCRIPT_OPENING_STORAGE_KEY,
  javascriptOpeningScenes,
} from './story/javascriptOpening'

const javascriptBattleRouteApi = getRouteApi('/javascript/battle/$battleId')
const typescriptBattleRouteApi = getRouteApi('/typescript/battle/$battleId')
const createRunSeed = () => crypto.randomUUID()

type SupportedAreaId = typeof JAVASCRIPT_AREA_ID | typeof TYPESCRIPT_AREA_ID

const openingSystemLines: Record<string, string> = {
  kingdom: 'SYSTEM STATUS // ALL SERVICES ONLINE',
  error: 'ALERT // combat.target -> unexpected enemy',
  ada: 'TASK // read existing code -> explain behavior -> fix',
  byte: 'DEBUG LOG // values OK / target selection WRONG',
  mission: 'OBJECTIVE // WEST · JAVASCRIPT GRASSLAND',
}

const hasExistingRun = () => {
  const stored = window.localStorage.getItem('code-reading-rpg:rpg-state')
  if (!stored) return false

  try {
    const parsed = JSON.parse(stored) as {
      state?: {
        worldPosition?: { x?: number; y?: number }
        encounterCount?: number
        openedTreasureIds?: unknown[]
        partyMemberIds?: unknown[]
      }
    }
    const state = parsed.state
    if (!state) return false
    const position = state.worldPosition
    return Boolean(
      (position && (position.x !== 20 || position.y !== 14)) ||
      (state.encounterCount ?? 0) > 0 ||
      (state.openedTreasureIds?.length ?? 0) > 0 ||
      (state.partyMemberIds?.length ?? 0) > 0,
    )
  } catch {
    return false
  }
}

const readOpeningSeen = () => {
  if (typeof window === 'undefined') return false
  return (
    window.localStorage.getItem(JAVASCRIPT_OPENING_STORAGE_KEY) === 'seen' || hasExistingRun()
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const [openingIndex, setOpeningIndex] = useState<number | null>(null)
  const [openingSeen, setOpeningSeen] = useState(readOpeningSeen)
  useBgm('menu')

  const enterWorld = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(JAVASCRIPT_OPENING_STORAGE_KEY, 'seen')
    }
    setOpeningSeen(true)
    navigate({ to: '/world' })
  }

  const start = () => {
    if (openingSeen) {
      navigate({ to: '/world' })
      return
    }
    setOpeningIndex(0)
  }

  if (openingIndex !== null) {
    const scene = javascriptOpeningScenes[openingIndex]
    const isLast = openingIndex === javascriptOpeningScenes.length - 1

    const next = () => {
      if (isLast) {
        enterWorld()
        return
      }
      setOpeningIndex((current) => (current === null ? 0 : current + 1))
    }

    return (
      <main className="app-shell opening-shell title-screen">
        <section className="opening-panel pixel-window" aria-label="JavaScript opening story">
          <div className="opening-progress">
            <span>OPENING // JAVASCRIPT KINGDOM</span>
            <span>{openingIndex + 1} / {javascriptOpeningScenes.length}</span>
          </div>

          <div className="opening-dots" aria-hidden="true">
            {javascriptOpeningScenes.map((entry, index) => (
              <span
                key={entry.id}
                className={`opening-dot ${index <= openingIndex ? 'is-active' : ''}`}
              />
            ))}
          </div>

          <section className="opening-scene pixel-inner-window" key={scene.id}>
            <div className="opening-kicker">{scene.kicker}</div>
            <div className="opening-speaker">{scene.speaker}</div>
            <div className="opening-copy">
              {scene.lines.map((line) => <p key={line}>{line}</p>)}
            </div>
            <div className="opening-system-line">{openingSystemLines[scene.id]}</div>
          </section>

          <div className="opening-actions">
            <button type="button" className="secondary-button" onClick={enterWorld}>
              SKIP
            </button>
            <button type="button" className="primary-button" onClick={next}>
              {isLast ? '▶ 西の草原へ' : 'NEXT ▶'}
            </button>
          </div>
        </section>
      </main>
    )
  }

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
          <button
            className="primary-button menu-button"
            aria-label={openingSeen ? 'CONTINUE · START RUN' : 'START'}
            onClick={start}
          >
            <span aria-hidden="true">▶</span> {openingSeen ? 'CONTINUE' : 'START'}
          </button>
          {openingSeen && (
            <button
              type="button"
              className="secondary-button opening-replay-button"
              onClick={() => setOpeningIndex(0)}
            >
              VIEW OPENING
            </button>
          )}
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

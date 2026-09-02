import { useEffect, useState } from 'react'
import { useNavigate, useParams, useRouterState, useSearch } from '@tanstack/react-router'
import App from './App'
import { useBgm } from './audio/useBgm'
import { useProgress } from './progression'
import { getStorySpeakerVisual, useRpg } from './rpg'
import { hasExistingRun } from './story/openingProgress'
import {
  areaById,
  getAreaDefinition,
  parseBattleRoute,
} from './game'
import {
  JAVASCRIPT_OPENING_STORAGE_KEY,
  javascriptOpeningScenes,
} from './story/javascriptOpening'
import type { StoryWorldLayer } from './story/types'

const createRunSeed = () => crypto.randomUUID()

const openingSystemLines: Record<string, string> = {
  briefing: 'REAL WORLD // 任務：想定外のtarget選択を調査する',
  incident: 'INCIDENT // 値は正常 / 選ばれたtargetが違う',
  connect: 'CONNECT // runtime model → CODE WORLD // code = 世界のルール',
  grassland: 'CODE WORLD // REAL WORLDのincidentと症状が同期',
  mission: '目的 // HUB：BYTE → 西：JavaScript草原',
}

const storyLayerLabels: Record<StoryWorldLayer, string> = {
  'real-world': 'REAL WORLD',
  connect: 'CONNECT',
  'code-world': 'CODE WORLD',
  remote: 'REMOTE LINK',
  return: 'RETURN // REAL WORLD',
}

const readOpeningSeen = () => {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(JAVASCRIPT_OPENING_STORAGE_KEY) === 'seen'
}

export function HomePage() {
  const navigate = useNavigate()
  const { rpgState } = useRpg()
  const { progress } = useProgress()
  const [openingIndex, setOpeningIndex] = useState<number | null>(null)
  const [openingSeen, setOpeningSeen] = useState(() => readOpeningSeen() || hasExistingRun(rpgState, progress))
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
    const speakerVisual = getStorySpeakerVisual(scene.speakerId)

    const next = () => {
      if (isLast) {
        enterWorld()
        return
      }
      setOpeningIndex((current) => (current === null ? 0 : current + 1))
    }

    return (
      <main className="app-shell opening-shell title-screen">
        <section className="opening-panel pixel-window" aria-label="JavaScript オープニングストーリー">
          <div className="opening-progress">
            <span>オープニング // REAL WORLD → CODE WORLD</span>
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

          <section
            className={`opening-scene pixel-inner-window is-${scene.layer}`}
            key={scene.id}
            data-story-layer={scene.layer}
          >
            <div className={`opening-layer-badge is-${scene.layer}`}>
              {storyLayerLabels[scene.layer]}
            </div>
            <div className="opening-kicker">{scene.kicker}</div>
            <div className="opening-speaker-card">
              {speakerVisual && (
                <img
                  className="opening-speaker-portrait"
                  src={speakerVisual}
                  alt={`${scene.speaker} portrait`}
                  width="64"
                  height="64"
                />
              )}
              <div className="opening-speaker">{scene.speaker}</div>
            </div>
            <div className="opening-copy">
              {scene.lines.map((line) => <p key={line}>{line}</p>)}
            </div>
            <div className="opening-system-line">{openingSystemLines[scene.id]}</div>
          </section>

          <div className="opening-actions">
            <button type="button" className="secondary-button" onClick={enterWorld}>
              スキップ
            </button>
            <button type="button" className="primary-button" onClick={next}>
              {isLast ? '▶ CODE WORLDを探索する' : '次へ ▶'}
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
        <div className="eyebrow">REAL WORLD × CODE WORLD // CODE READING RPG</div>
        <h1>
          CODE<span>//</span>READ <em>RPG</em>
        </h1>
        <p className="hero-copy">現実のincidentを、CODE WORLDでコードを読んで解決する。</p>

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

        <nav className="title-menu" aria-label="タイトルメニュー">
          <button
            className="primary-button menu-button"
            aria-label={openingSeen ? '続きから' : 'はじめる'}
            onClick={start}
          >
            <span aria-hidden="true">▶</span> {openingSeen ? '続きから' : 'はじめる'}
          </button>
          {openingSeen && (
            <button
              type="button"
              className="secondary-button opening-replay-button"
              onClick={() => setOpeningIndex(0)}
            >
              オープニングを見る
            </button>
          )}
        </nav>

        <div className="title-footer">REAL INCIDENT // CODE WORLD // コードのルールを読む</div>
      </section>
    </main>
  )
}

export function BattleRoutePage() {
  const { battleId = '', areaId } = useParams({ strict: false })
  const { seed: searchSeed, returnTo } = useSearch({ strict: false })
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const route = parseBattleRoute(pathname)
  const area = route?.area ?? getAreaDefinition(areaId ?? pathname.split('/')[1])
  const navigate = useNavigate()
  const [fallbackSeed] = useState(createRunSeed)
  const seed = searchSeed ?? fallbackSeed
  const exists = Boolean(route)

  useEffect(() => {
    if (searchSeed || !exists || !area) return
    navigate({
      to: '/$areaId/battle/$battleId',
      params: { areaId: area.id, battleId },
      search: { seed, returnTo },
      replace: true,
    })
  }, [area, battleId, exists, navigate, returnTo, searchSeed, seed])

  if (!route) return <NotFoundBattle areaId={area?.id} />
  return <App key={`${route.area.id}:${battleId}:${seed}:${returnTo ?? ''}`} battleId={route.battleId} seed={seed} returnTo={returnTo} />
}

function NotFoundBattle({ areaId }: { areaId?: string }) {
  const navigate = useNavigate()
  useBgm('menu')
  const area = areaId ? areaById[areaId] : undefined

  return (
    <main className="app-shell center-shell title-screen">
      <section className="result-card defeat-card pixel-window">
        <div className="eyebrow">ルートエラー</div>
        <h2>そのBattleはこのAreaに存在しない</h2>
        {area && <p>{area.title}</p>}
        <button className="primary-button" onClick={() => navigate({ to: '/world' })}>
          ◀ ワールドへ戻る
        </button>
      </section>
    </main>
  )
}

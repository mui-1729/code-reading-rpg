import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { gameAudio } from '../audio/gameAudio'
import { useBgm } from '../audio/useBgm'
import { useProgress } from '../progression'
import { characterVisuals, useRpg } from '../rpg'
import { openWorldTreasure } from './treasures'
import { resolveWorldMove } from './worldActions'
import {
  getTreasureAtPosition,
  getVisibleWorldCells,
  isAdjacent,
  TS_BOSS_POSITION,
  TS_FRONTIER_MAP_ID,
  type Terrain,
} from './worldMap'

const VIEWPORT_COLUMNS = 11
const VIEWPORT_ROWS = 9

type Position = { x: number; y: number }

const terrainLabels: Record<Terrain, string> = {
  mountain: 'Boundary wall',
  water: 'Water',
  road: 'Road',
  stone: 'Rune Stone Road',
  crystal: 'Crystal Field · TypeScript encounter',
  ruins: 'Ancient Ruins · TypeScript encounter',
  gate: 'Frontier Gate',
  town: 'Town',
  grass: 'Grassland',
  'tall-grass': 'Tall Grass',
  woods: 'Woods',
  'deep-woods': 'Deep Woods',
  forest: 'Forest',
  boss: 'Type Warden',
  midboss: 'Mid-Boss',
  shop: 'Shop',
  npc: 'NPC',
  recovery: 'Inn / Rest',
  treasure: 'Type Cache',
  village: 'Village entrance',
  exit: 'Area exit',
  house: 'House',
  training: 'Training Ground',
}

export function TypeScriptFrontierPage() {
  const navigate = useNavigate()
  const { progress, setProgress } = useProgress()
  const { rpgState, setRpgState } = useRpg()
  const [message, setMessage] = useState(
    'TYPE GATEの先はTypeScript Frontier。石畳を東へ進み、結晶と遺跡で型のruleを読む。',
  )
  useBgm('field')

  const position = rpgState.worldPosition
  const visibleCells = useMemo(
    () => getVisibleWorldCells(position, TS_FRONTIER_MAP_ID),
    [position],
  )
  const viewportStart = visibleCells[0] ?? position
  const byteJoined = rpgState.partyMemberIds.includes('byte')
  const [followerPosition, setFollowerPosition] = useState<Position>(() => ({
    x: position.x,
    y: position.y + 1,
  }))

  const objective = useMemo(() => {
    if (progress.clearedAreaIds.includes('typescript') || progress.clearedStageIds.includes(6)) {
      return {
        label: 'TYPESCRIPT CLEAR',
        title: 'Frontier Compilerを復旧した',
        detail: 'TypeScript地方の異変は解決した。西のGATEからCentral Hubへ戻れる。',
        clear: true,
      }
    }
    if (!progress.clearedStageIds.includes(4)) {
      return {
        label: 'TYPESCRIPT · 1 / 3',
        title: '結晶地帯で型の違いを読む',
        detail: '石畳を外れてCRYSTAL / RUINSへ入ろう。最初のEncounterでBattle 4を読む。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(5)) {
      return {
        label: 'TYPESCRIPT · 2 / 3',
        title: '型のruleをもう一段深く読む',
        detail: 'さらに東へ進み、CRYSTAL / RUINSでBattle 5を読む。clear済みBattleは復習として再登場する。',
        clear: false,
      }
    }
    return {
      label: 'TYPESCRIPT · FINAL BOSS',
      title: '北東のTYPE WARDENへ向かう',
      detail: 'Battle 4 / 5でruleを確認した。北東のBOSSの隣でINTERACTし、Battle 6へ挑もう。',
      clear: false,
    }
  }, [progress.clearedAreaIds, progress.clearedStageIds])

  const spriteStyle = useCallback(
    (spritePosition: Position) => ({
      left: `${((spritePosition.x - viewportStart.x + 0.5) / VIEWPORT_COLUMNS) * 100}%`,
      top: `${((spritePosition.y - viewportStart.y + 0.5) / VIEWPORT_ROWS) * 100}%`,
    }),
    [viewportStart.x, viewportStart.y],
  )

  const followerVisible =
    byteJoined &&
    followerPosition.x >= viewportStart.x &&
    followerPosition.x < viewportStart.x + VIEWPORT_COLUMNS &&
    followerPosition.y >= viewportStart.y &&
    followerPosition.y < viewportStart.y + VIEWPORT_ROWS

  const enterBattle = useCallback(
    (battleId: number, seed: string) => {
      gameAudio.playSe('confirm')
      navigate({
        to: '/typescript/battle/$battleId',
        params: { battleId: String(battleId) },
        search: { seed, returnTo: '/world' },
      })
    },
    [navigate],
  )

  const move = useCallback(
    (dx: number, dy: number) => {
      if (document.body.dataset.rpgPaused === 'true') return

      const result = resolveWorldMove({ rpgState, progress, dx, dy })
      if (result.kind === 'blocked') {
        gameAudio.playSe('cancel')
        setMessage(
          result.terrain === 'boss'
            ? 'TYPE WARDENが道を塞いでいる。隣からINTERACT。'
            : result.terrain === 'treasure'
              ? 'TYPE CACHE。隣からINTERACTして調べる。'
              : '崩れた境界の先へは進めない。',
        )
        return
      }

      if (result.kind === 'transition') {
        setRpgState(result.nextState)
        gameAudio.playSe('confirm')
        setMessage(`${result.label}へ戻った。JavaScript地方とTypeScript地方はGATEで分かれている。`)
        return
      }

      if (byteJoined) setFollowerPosition(position)
      setRpgState(result.nextState)
      if (result.kind === 'encounter') {
        setMessage('TYPE ENCOUNTER!')
        enterBattle(result.battle.battleId, result.battle.seed)
        return
      }

      setMessage(terrainLabels[result.terrain] ?? result.terrain)
    },
    [byteJoined, enterBattle, position, progress, rpgState, setRpgState],
  )

  const interact = useCallback(() => {
    if (document.body.dataset.rpgPaused === 'true') return

    const treasure = getTreasureAtPosition({ x: position.x, y: position.y }, TS_FRONTIER_MAP_ID)
    const adjacentTreasure = visibleCells
      .map((cell) => getTreasureAtPosition(cell, TS_FRONTIER_MAP_ID))
      .find((candidate) => candidate && isAdjacent(position, candidate.position))

    if (treasure || adjacentTreasure) {
      const target = treasure ?? adjacentTreasure
      if (!target) return
      const result = openWorldTreasure(progress, rpgState, target.id)
      if (!result.opened) {
        gameAudio.playSe('cancel')
        setMessage(`${result.definition.name}: もう開けてある。`)
        return
      }
      setProgress(result.progress)
      setRpgState(result.rpgState)
      gameAudio.playSe('confirm')
      setMessage(
        `${result.definition.name} OPEN // +${result.definition.reward.gold}G` +
          (result.definition.reward.patchKit > 0
            ? ` / PATCH KIT ×${result.definition.reward.patchKit}`
            : ''),
      )
      return
    }

    if (isAdjacent(position, TS_BOSS_POSITION)) {
      if (!progress.unlockedStageIds.includes(6) && !progress.clearedStageIds.includes(5)) {
        gameAudio.playSe('cancel')
        setMessage('BYTE: まずFrontierのBattle 4 / 5を終わらせよう。二つの型ruleが揃えばTYPE WARDENへ挑める。')
        return
      }
      enterBattle(6, `boss:ts:${rpgState.encounterCount}`)
      return
    }

    setMessage(
      progress.clearedStageIds.includes(5)
        ? '北東のTYPE WARDENへ向かおう。BOSSの隣でINTERACT。'
        : '石畳を外れてCRYSTAL / RUINSへ入るとTypeScript Battleが起こる。',
    )
  }, [enterBattle, position, progress, rpgState, setProgress, setRpgState, visibleCells])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (document.body.dataset.rpgPaused === 'true') return
      const key = event.key.toLowerCase()
      if (key === 'arrowup' || key === 'w') {
        event.preventDefault()
        move(0, -1)
      } else if (key === 'arrowdown' || key === 's') {
        event.preventDefault()
        move(0, 1)
      } else if (key === 'arrowleft' || key === 'a') {
        event.preventDefault()
        move(-1, 0)
      } else if (key === 'arrowright' || key === 'd') {
        event.preventDefault()
        move(1, 0)
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        interact()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [interact, move])

  return (
    <main className="app-shell world-shell title-screen">
      <section className="pixel-window world-panel typescript-frontier-panel">
        <header className="world-header">
          <div>
            <div className="eyebrow">LOCAL MAP // TYPESCRIPT FRONTIER</div>
            <h1>TYPESCRIPT FRONTIER</h1>
            <p>
              JavaScriptの草原とは別の地方。Rune Stone Roadを軸に、Crystal FieldとAncient Ruinsで型のruleを読む。
            </p>
          </div>
        </header>

        <section
          className={`world-next-objective pixel-inner-window ${objective.clear ? 'is-clear' : ''}`}
          aria-label="Next objective"
        >
          <span>{objective.label}</span>
          <strong>{objective.title}</strong>
          <p>{objective.detail}</p>
        </section>

        <div
          className="world-viewport typescript-frontier-viewport pixel-inner-window"
          aria-label="TypeScript Frontier map"
          data-world-map={TS_FRONTIER_MAP_ID}
          data-world-x={position.x}
          data-world-y={position.y}
        >
          {visibleCells.map((cell) => {
            const treasure =
              cell.terrain === 'treasure'
                ? getTreasureAtPosition(cell, TS_FRONTIER_MAP_ID)
                : undefined
            const treasureOpened = treasure
              ? rpgState.openedTreasureIds.includes(treasure.id)
              : false
            return (
              <div
                key={`${cell.mapId}:${cell.x}:${cell.y}`}
                className={`world-tile terrain-${cell.terrain}`}
                title={terrainLabels[cell.terrain]}
                data-world-map={cell.mapId}
                data-world-x={cell.x}
                data-world-y={cell.y}
              >
                {cell.terrain === 'gate' && <span className="world-object gate-object">GATE</span>}
                {cell.terrain === 'boss' && <span className="world-object boss-object">TYPE WARDEN</span>}
                {treasure && (
                  <span
                    className={`world-object treasure-object ${treasureOpened ? 'opened' : ''}`}
                    aria-label={`${treasure.id} treasure ${treasureOpened ? 'opened' : 'closed'}`}
                  >
                    {treasureOpened ? 'OPEN' : 'TYPE CACHE'}
                  </span>
                )}
              </div>
            )
          })}

          <div
            className="world-character-layer"
            aria-hidden="true"
            data-world-map={TS_FRONTIER_MAP_ID}
            data-world-x={position.x}
            data-world-y={position.y}
          >
            {followerVisible && (
              <span
                className="world-follower-sprite world-character-overlay"
                style={spriteStyle(followerPosition)}
                data-world-map={TS_FRONTIER_MAP_ID}
                data-world-x={followerPosition.x}
                data-world-y={followerPosition.y}
              >
                <img className="world-follower-pixel" src={characterVisuals.byte.field} alt="" />
              </span>
            )}
            <span
              className="world-player-sprite world-character-overlay"
              style={spriteStyle(position)}
              data-world-map={TS_FRONTIER_MAP_ID}
              data-world-x={position.x}
              data-world-y={position.y}
            >
              <img className="world-player-pixel" src={characterVisuals.player.field} alt="" />
            </span>
          </div>
        </div>

        <section className="world-message pixel-inner-window" aria-live="polite">
          <span>FRONTIER LOG</span>
          <p>{message}</p>
        </section>

        <div className="world-controls" aria-label="World controls">
          <div className="world-dpad">
            <button type="button" aria-label="Move up" onClick={() => move(0, -1)}>▲</button>
            <button type="button" aria-label="Move left" onClick={() => move(-1, 0)}>◀</button>
            <button type="button" aria-label="Move down" onClick={() => move(0, 1)}>▼</button>
            <button type="button" aria-label="Move right" onClick={() => move(1, 0)}>▶</button>
          </div>
          <button type="button" className="primary-button world-interact" onClick={interact}>
            INTERACT
          </button>
        </div>
      </section>
    </main>
  )
}

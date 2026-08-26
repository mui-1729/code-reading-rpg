import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { gameAudio } from '../audio/gameAudio'
import { useBgm } from '../audio/useBgm'
import { PATCH_KIT_PRICE, purchasePatchKit } from '../economy'
import { createSeededRandom } from '../game'
import { useProgress } from '../progression'
import { emptyPartyEquipment, useRpg } from '../rpg'
import {
  BYTE_POSITION,
  getEncounterBattleId,
  getEncounterChance,
  getTerrain,
  getVisibleWorldCells,
  getWorldRegion,
  isAdjacent,
  isEncounterTerrain,
  isWalkableTerrain,
  JS_BOSS_POSITION,
  SHOP_POSITION,
  TS_BOSS_POSITION,
} from './worldMap'

const regionLabels = {
  javascript: 'JAVASCRIPT GRASSLAND',
  hub: 'CENTRAL HUB',
  typescript: 'TYPESCRIPT FOREST',
} as const

const terrainLabels: Record<string, string> = {
  mountain: 'Mountain',
  water: 'Water',
  road: 'Road',
  town: 'Hub',
  grass: 'Grassland',
  'tall-grass': 'Tall Grass · JavaScript encounter',
  forest: 'Forest · TypeScript encounter',
  boss: 'Boss',
  shop: 'Shop',
  npc: 'NPC',
}

export function WorldPage() {
  const navigate = useNavigate()
  const { progress, setProgress } = useProgress()
  const { rpgState, setRpgState } = useRpg()
  const [message, setMessage] = useState('草むらではJavaScript、森ではTypeScriptのEnemyが出現する。')
  useBgm('field')

  const position = rpgState.worldPosition
  const region = getWorldRegion(position.x)
  const visibleCells = useMemo(() => getVisibleWorldCells(position), [position])

  useEffect(() => {
    const rewards: string[] = []
    if (progress.clearedAreaIds.includes('javascript')) rewards.push('branch-saber')
    if (progress.clearedAreaIds.includes('typescript')) rewards.push('typed-mail')
    if (rewards.length === 0) return

    setRpgState((current) => {
      const missing = rewards.filter((id) => !current.ownedEquipmentIds.includes(id))
      if (missing.length === 0) return current
      return { ...current, ownedEquipmentIds: [...current.ownedEquipmentIds, ...missing] }
    })
  }, [progress.clearedAreaIds, setRpgState])

  const enterBattle = useCallback((battleId: number, battleRegion: 'javascript' | 'typescript', seed: string) => {
    gameAudio.playSe('confirm')
    if (battleRegion === 'javascript') {
      navigate({
        to: '/javascript/battle/$battleId',
        params: { battleId: String(battleId) },
        search: { seed, returnTo: '/world' },
      })
      return
    }
    navigate({
      to: '/typescript/battle/$battleId',
      params: { battleId: String(battleId) },
      search: { seed, returnTo: '/world' },
    })
  }, [navigate])

  const move = useCallback((dx: number, dy: number) => {
    if (document.body.dataset.rpgPaused === 'true') return

    const next = { x: position.x + dx, y: position.y + dy }
    const terrain = getTerrain(next.x, next.y)
    if (!isWalkableTerrain(terrain)) {
      gameAudio.playSe('cancel')
      setMessage(terrain === 'boss' ? 'Bossが道を塞いでいる。隣からINTERACT。' : 'そこへは進めない。')
      return
    }

    const nextSteps = rpgState.stepsSinceEncounter + 1
    const nextRegion = getWorldRegion(next.x)
    const nextState = {
      ...rpgState,
      worldPosition: next,
      stepsSinceEncounter: nextSteps,
    }

    if (isEncounterTerrain(terrain) && nextSteps >= 5) {
      const seedBase = `${rpgState.encounterCount}:${next.x}:${next.y}:${nextSteps}`
      const random = createSeededRandom(seedBase)
      if (random.next() < getEncounterChance(terrain)) {
        const battleId = getEncounterBattleId(
          nextRegion,
          progress.unlockedStageIds,
          progress.clearedStageIds,
          random.next(),
        )
        if (battleId !== null && nextRegion !== 'hub') {
          const encounterNumber = rpgState.encounterCount + 1
          setRpgState({
            ...nextState,
            stepsSinceEncounter: 0,
            encounterCount: encounterNumber,
          })
          setMessage('ENCOUNTER!')
          enterBattle(battleId, nextRegion, `encounter:${encounterNumber}:${next.x}:${next.y}`)
          return
        }
      }
    }

    setRpgState(nextState)
    setMessage(terrainLabels[terrain] ?? terrain)
  }, [enterBattle, position, progress.clearedStageIds, progress.unlockedStageIds, rpgState, setRpgState])

  const interact = useCallback(() => {
    if (document.body.dataset.rpgPaused === 'true') return

    if (isAdjacent(position, BYTE_POSITION)) {
      if (rpgState.partyMemberIds.includes('byte')) {
        setMessage('BYTE: 森の方は型が厳しい。装備を整えて行こう。')
        return
      }
      gameAudio.playSe('skillUnlock')
      setRpgState((current) => ({
        ...current,
        partyMemberIds: [...current.partyMemberIds, 'byte'],
        partyEquipment: { ...current.partyEquipment, byte: emptyPartyEquipment() },
      }))
      setMessage('BYTE joined the party! Battleで追撃してくれる。')
      return
    }

    if (isAdjacent(position, SHOP_POSITION)) {
      const result = purchasePatchKit(progress)
      if (!result.purchased) {
        gameAudio.playSe('cancel')
        setMessage(`PATCH KITは${PATCH_KIT_PRICE} G。Goldが足りない。`)
        return
      }
      gameAudio.playSe('confirm')
      setProgress(result.progress)
      setMessage(`PATCH KITを購入した。残り ${result.progress.gold} G。`)
      return
    }

    if (isAdjacent(position, JS_BOSS_POSITION)) {
      if (!progress.unlockedStageIds.includes(3)) {
        setMessage('JS Bossへの道はまだ開かない。草むらのEncounterを進めよう。')
        return
      }
      enterBattle(3, 'javascript', `boss:js:${rpgState.encounterCount}`)
      return
    }

    if (isAdjacent(position, TS_BOSS_POSITION)) {
      if (!progress.unlockedStageIds.includes(6)) {
        setMessage('TS Bossへの道はまだ開かない。森のEncounterを進めよう。')
        return
      }
      enterBattle(6, 'typescript', `boss:ts:${rpgState.encounterCount}`)
      return
    }

    setMessage('近くに調べられるものはない。')
  }, [enterBattle, position, progress, rpgState.encounterCount, rpgState.partyMemberIds, setProgress, setRpgState])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (document.body.dataset.rpgPaused === 'true') return
      const key = event.key.toLowerCase()
      if (key === 'arrowup' || key === 'w') {
        event.preventDefault(); move(0, -1)
      } else if (key === 'arrowdown' || key === 's') {
        event.preventDefault(); move(0, 1)
      } else if (key === 'arrowleft' || key === 'a') {
        event.preventDefault(); move(-1, 0)
      } else if (key === 'arrowright' || key === 'd') {
        event.preventDefault(); move(1, 0)
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault(); interact()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [interact, move])

  return (
    <main className="app-shell world-shell title-screen">
      <section className="pixel-window world-panel">
        <header className="world-header">
          <div>
            <div className="eyebrow">OPEN WORLD // {regionLabels[region]}</div>
            <h1>CODE WORLD</h1>
            <p>上下左右へ探索。草むら=JS、森=TS。Bossは固定地点にいる。</p>
          </div>
        </header>

        <div className="world-viewport pixel-inner-window" aria-label="Open world map">
          {visibleCells.map((cell) => {
            const player = cell.x === position.x && cell.y === position.y
            return (
              <div
                key={`${cell.x}:${cell.y}`}
                className={`world-tile terrain-${cell.terrain}`}
                title={terrainLabels[cell.terrain]}
                data-world-x={cell.x}
                data-world-y={cell.y}
              >
                {cell.terrain === 'boss' && <span className="world-object boss-object">BOSS</span>}
                {cell.terrain === 'shop' && <span className="world-object shop-object">SHOP</span>}
                {cell.terrain === 'npc' && <span className="world-object npc-object">B</span>}
                {player && <span className="world-player-sprite" aria-label="Player">◆</span>}
              </div>
            )
          })}
        </div>

        <section className="world-message pixel-inner-window" aria-live="polite">
          <span>FIELD LOG</span>
          <p>{message}</p>
        </section>

        <div className="world-controls" aria-label="World controls">
          <div className="world-dpad">
            <button type="button" aria-label="Move up" onClick={() => move(0, -1)}>▲</button>
            <button type="button" aria-label="Move left" onClick={() => move(-1, 0)}>◀</button>
            <button type="button" aria-label="Move down" onClick={() => move(0, 1)}>▼</button>
            <button type="button" aria-label="Move right" onClick={() => move(1, 0)}>▶</button>
          </div>
          <button type="button" className="primary-button world-interact" onClick={interact}>INTERACT</button>
        </div>
      </section>
    </main>
  )
}

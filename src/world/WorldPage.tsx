import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { gameAudio } from '../audio/gameAudio'
import { useBgm } from '../audio/useBgm'
import { PATCH_KIT_PRICE, purchasePatchKit } from '../economy'
import { useProgress } from '../progression'
import { emptyPartyEquipment, equipmentById, getCombatStats, useRpg } from '../rpg'
import { openWorldTreasure } from './treasures'
import { resolveWorldInteraction, resolveWorldMove } from './worldActions'
import { getTreasureAtPosition, getVisibleWorldCells, getWorldRegion } from './worldMap'

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
  recovery: 'Recovery Point',
  treasure: 'Treasure',
}

export function WorldPage() {
  const navigate = useNavigate()
  const { progress, stats, setProgress } = useProgress()
  const { rpgState, setRpgState } = useRpg()
  const [message, setMessage] = useState('草むらではJavaScript、森ではTypeScriptのEnemyが出現する。')
  useBgm('field')

  const position = rpgState.worldPosition
  const region = getWorldRegion(position.x)
  const visibleCells = useMemo(() => getVisibleWorldCells(position), [position])
  const combatStats = getCombatStats(stats, rpgState)

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

  const enterBattle = useCallback(
    (battleId: number, battleRegion: 'javascript' | 'typescript', seed: string) => {
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
            ? 'Bossが道を塞いでいる。隣からINTERACT。'
            : result.terrain === 'recovery'
              ? 'REST地点。隣からINTERACTするとHPを全回復できる。'
              : result.terrain === 'treasure'
                ? 'Treasure。隣からINTERACTして調べる。'
                : 'そこへは進めない。',
        )
        return
      }

      setRpgState(result.nextState)
      if (result.kind === 'encounter') {
        setMessage('ENCOUNTER!')
        enterBattle(result.battle.battleId, result.battle.region, result.battle.seed)
        return
      }

      setMessage(terrainLabels[result.terrain] ?? result.terrain)
    },
    [enterBattle, progress, rpgState, setRpgState],
  )

  const interact = useCallback(() => {
    if (document.body.dataset.rpgPaused === 'true') return

    const intent = resolveWorldInteraction(rpgState, progress)

    if (intent.kind === 'party') {
      if (intent.alreadyJoined) {
        setMessage('BYTE: 森の方は型が厳しい。装備を整えて行こう。')
        return
      }
      gameAudio.playSe('skillUnlock')
      setRpgState((current) => ({
        ...current,
        partyMemberIds: [...current.partyMemberIds, intent.memberId],
        partyEquipment: {
          ...current.partyEquipment,
          [intent.memberId]: emptyPartyEquipment(),
        },
      }))
      setMessage('BYTE joined the party! Battleで追撃してくれる。')
      return
    }

    if (intent.kind === 'shop') {
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

    if (intent.kind === 'recovery') {
      if (rpgState.currentHp >= combatStats.maxHp) {
        gameAudio.playSe('confirm')
        setMessage('REST: HPはすでに満タン。')
        return
      }
      gameAudio.playSe('levelUp')
      setRpgState((current) => ({ ...current, currentHp: combatStats.maxHp }))
      setMessage(`REST: HP ${combatStats.maxHp} / ${combatStats.maxHp} · FULL RECOVERY`)
      return
    }

    if (intent.kind === 'treasure') {
      const result = openWorldTreasure(progress, rpgState, intent.treasureId)
      if (!result.opened) {
        gameAudio.playSe('cancel')
        setMessage(`${result.definition.name}: すでに空だ。`)
        return
      }

      setProgress(result.progress)
      setRpgState(result.rpgState)
      gameAudio.playSe(result.equipmentAwarded ? 'skillUnlock' : 'confirm')

      const rewards: string[] = []
      if (result.definition.reward.gold > 0) rewards.push(`+${result.definition.reward.gold} G`)
      if (result.definition.reward.patchKit > 0) {
        rewards.push(`PATCH KIT ×${result.definition.reward.patchKit}`)
      }
      const equipmentId = result.definition.reward.equipmentId
      if (result.equipmentAwarded && equipmentId) {
        rewards.push(equipmentById[equipmentId]?.name ?? equipmentId)
      }
      setMessage(`${result.definition.name} OPEN → ${rewards.join(' / ')}`)
      return
    }

    if (intent.kind === 'boss') {
      if (!intent.unlocked) {
        setMessage(
          intent.region === 'javascript'
            ? 'JS Bossへの道はまだ開かない。草むらのEncounterを進めよう。'
            : 'TS Bossへの道はまだ開かない。森のEncounterを進めよう。',
        )
        return
      }
      enterBattle(intent.battleId, intent.region, intent.seed)
      return
    }

    setMessage('近くに調べられるものはない。')
  }, [combatStats.maxHp, enterBattle, progress, rpgState, setProgress, setRpgState])

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
            const treasure = cell.terrain === 'treasure' ? getTreasureAtPosition(cell) : undefined
            const treasureOpened = treasure
              ? rpgState.openedTreasureIds.includes(treasure.id)
              : false
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
                {cell.terrain === 'recovery' && <span className="world-object recovery-object">REST</span>}
                {treasure && (
                  <span
                    className={`world-object treasure-object ${treasureOpened ? 'opened' : ''}`}
                    aria-label={`${treasure.id} treasure ${treasureOpened ? 'opened' : 'closed'}`}
                  >
                    {treasureOpened ? 'OPEN' : 'CHEST'}
                  </span>
                )}
                {player && (
                  <span className="world-player-sprite" aria-label="Player">
                    ◆
                  </span>
                )}
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
            <button type="button" aria-label="Move up" onClick={() => move(0, -1)}>
              ▲
            </button>
            <button type="button" aria-label="Move left" onClick={() => move(-1, 0)}>
              ◀
            </button>
            <button type="button" aria-label="Move down" onClick={() => move(0, 1)}>
              ▼
            </button>
            <button type="button" aria-label="Move right" onClick={() => move(1, 0)}>
              ▶
            </button>
          </div>
          <button type="button" className="primary-button world-interact" onClick={interact}>
            INTERACT
          </button>
        </div>
      </section>
    </main>
  )
}

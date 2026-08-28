import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { gameAudio } from '../audio/gameAudio'
import { useBgm } from '../audio/useBgm'
import { WorldInn, WorldShop } from '../economy'
import { useProgress } from '../progression'
import {
  characterVisuals,
  emptyPartyEquipment,
  equipmentById,
  useRpg,
} from '../rpg'
import { openWorldTreasure } from './treasures'
import { resolveWorldInteraction, resolveWorldMove } from './worldActions'
import {
  getTreasureAtPosition,
  getVisibleWorldCells,
  getWorldMapLabel,
  getWorldRegion,
  JS_VILLAGE_MAP_ID,
} from './worldMap'

const regionLabels = {
  javascript: 'JAVASCRIPT WEST',
  hub: 'CENTRAL HUB',
  typescript: 'TYPESCRIPT FRONTIER',
} as const

const terrainLabels: Record<string, string> = {
  mountain: 'Mountain',
  water: 'Water',
  road: 'Road',
  town: 'Town',
  grass: 'Grassland',
  'tall-grass': 'Tall Grass · JavaScript encounter',
  woods: 'Woods · JavaScript encounter',
  'deep-woods': 'Deep Woods · JavaScript encounter',
  forest: 'Forest · TypeScript encounter',
  boss: 'Boss',
  shop: 'Shop',
  npc: 'NPC',
  recovery: 'Inn / Rest',
  treasure: 'Treasure',
  village: 'Village entrance',
  exit: 'Village exit',
  house: 'House',
}

const VIEWPORT_COLUMNS = 11
const VIEWPORT_ROWS = 9

type Position = { x: number; y: number }

export function WorldPage() {
  const navigate = useNavigate()
  const { progress, setProgress } = useProgress()
  const { rpgState, setRpgState } = useRpg()
  const [message, setMessage] = useState(
    '西の草原ではJavaScript、東側ではTypeScriptのBattleが起こる。',
  )
  const [shopOpen, setShopOpen] = useState(false)
  const [innOpen, setInnOpen] = useState(false)
  useBgm('field')

  const mapId = rpgState.worldMapId
  const position = rpgState.worldPosition
  const [followerPosition, setFollowerPosition] = useState<Position>(() => ({
    x: position.x,
    y: position.y + 1,
  }))
  const region = getWorldRegion(position.x, mapId)
  const visibleCells = useMemo(() => getVisibleWorldCells(position, mapId), [mapId, position])
  const byteJoined = rpgState.partyMemberIds.includes('byte')
  const viewportStart = visibleCells[0] ?? position
  const isVillage = mapId === JS_VILLAGE_MAP_ID

  const javascriptStoryBrief = useMemo(() => {
    if (progress.clearedAreaIds.includes('javascript') || progress.clearedStageIds.includes(3)) {
      return '西の異変は収まった。技は狙った相手へ飛ぶようになった。'
    }
    if (progress.clearedStageIds.includes(2)) {
      return 'BYTE // おかしな動きの原因は、もっと西の奥にあるみたいだ。Code Coreまで確かめに行こう。'
    }
    if (progress.clearedStageIds.includes(1)) {
      return 'BYTE // 別の技でも同じようなズレが起きている。どの敵を選ぶruleなのか、もう少し見てみよう。'
    }
    return 'LEAD ADA // 西の草原で、技が違う魔物へ飛ぶことがある。まず何を見て相手を選んでいるか確かめよう。'
  }, [progress.clearedAreaIds, progress.clearedStageIds])

  const javascriptNextObjective = useMemo(() => {
    if (progress.clearedAreaIds.includes('javascript') || progress.clearedStageIds.includes(3)) {
      return {
        label: 'JAVASCRIPT CLEAR',
        title: '西の異変は解決した',
        detail: 'JavaScript地方は落ち着いた。次の地方へ進める。',
        clear: true,
      }
    }
    if (progress.clearedStageIds.includes(2)) {
      return {
        label: 'NEXT OBJECTIVE · 4 / 4',
        title: '西の最深部へ向かう',
        detail: '北西の道を進み、BOSSの隣でINTERACT。異変の原因を確かめよう。',
        clear: false,
      }
    }
    if (progress.clearedStageIds.includes(1)) {
      return {
        label: 'NEXT OBJECTIVE · 3 / 4',
        title: '西でもう少し戦って確かめる',
        detail: '草むらを歩き、別のBattleでも「どの敵が選ばれるか」を読んでみよう。',
        clear: false,
      }
    }
    if (!byteJoined) {
      return {
        label: 'NEXT OBJECTIVE · 1 / 4',
        title: 'BYTEと合流する',
        detail: '開始地点の近くにいるBYTEの隣でINTERACT。仲間になったら西へ向かおう。',
        clear: false,
      }
    }
    return {
      label: 'NEXT OBJECTIVE · 2 / 4',
      title: '西のJavaScript地方へ向かう',
      detail: 'Hubから西へ進もう。道の途中には村もある。濃い草むらではBattleが起こる。',
      clear: false,
    }
  }, [byteJoined, progress.clearedAreaIds, progress.clearedStageIds])

  const currentObjective = isVillage
    ? {
        label: 'GREENFIELD VILLAGE',
        title: '村を歩いてみる',
        detail: 'ここではBattleは起きない。南のEXITからJavaScript地方へ戻れる。',
        clear: false,
      }
    : javascriptNextObjective

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
      if (shopOpen || innOpen || document.body.dataset.rpgPaused === 'true') return

      const result = resolveWorldMove({ rpgState, progress, dx, dy })
      if (result.kind === 'blocked') {
        gameAudio.playSe('cancel')
        setMessage(
          result.terrain === 'boss'
            ? '強い魔物が道を塞いでいる。隣からINTERACT。'
            : result.terrain === 'recovery'
              ? 'INN。隣からINTERACTすると休める。'
              : result.terrain === 'treasure'
                ? 'Treasure。隣からINTERACTして調べる。'
                : result.terrain === 'house'
                  ? '家がある。今は中へは入れない。'
                  : 'そこへは進めない。',
        )
        return
      }

      if (result.kind === 'transition') {
        if (byteJoined) {
          setFollowerPosition({
            x: result.nextState.worldPosition.x,
            y: result.nextState.worldPosition.y + 1,
          })
        }
        setRpgState(result.nextState)
        gameAudio.playSe('confirm')
        setMessage(
          result.toMapId === JS_VILLAGE_MAP_ID
            ? `${result.label}へ入った。村の中ではBattleは起きない。`
            : `${result.label}へ戻った。西へ進むほど森が深くなっていく。`,
        )
        return
      }

      if (byteJoined) setFollowerPosition(position)
      setRpgState(result.nextState)
      if (result.kind === 'encounter') {
        setMessage('ENCOUNTER!')
        enterBattle(result.battle.battleId, result.battle.region, result.battle.seed)
        return
      }

      setMessage(terrainLabels[result.terrain] ?? result.terrain)
    },
    [byteJoined, enterBattle, innOpen, position, progress, rpgState, setRpgState, shopOpen],
  )

  const interact = useCallback(() => {
    if (shopOpen || innOpen || document.body.dataset.rpgPaused === 'true') return

    const intent = resolveWorldInteraction(rpgState, progress)

    if (intent.kind === 'party') {
      if (intent.alreadyJoined) {
        if (!progress.clearedStageIds.includes(1)) {
          setMessage('BYTE: 敵のHPと、技の横に出るコードを順番に見てみよう。')
        } else if (!progress.clearedStageIds.includes(2)) {
          setMessage('BYTE: 別の技でも同じようなズレがあるみたい。西でもう少し確かめよう。')
        } else if (!progress.clearedAreaIds.includes('javascript')) {
          setMessage('BYTE: 原因はもっと西の奥につながってる。Code Coreまで行ってみよう。')
        } else {
          setMessage('BYTE: 西は落ち着いたね。東にはTypeScript地方が広がっている。')
        }
        return
      }
      gameAudio.playSe('skillUnlock')
      setFollowerPosition({ x: position.x, y: position.y + 1 })
      setRpgState((current) => ({
        ...current,
        partyMemberIds: [...current.partyMemberIds, intent.memberId],
        partyEquipment: {
          ...current.partyEquipment,
          [intent.memberId]: emptyPartyEquipment(),
        },
      }))
      setMessage('BYTE joined the party! Battleでは、同じ相手へ追撃してくれる。')
      return
    }

    if (intent.kind === 'shop') {
      gameAudio.playSe('confirm')
      setShopOpen(true)
      setMessage('SHOP: Item / Equipmentを選んで購入できる。')
      return
    }

    if (intent.kind === 'recovery') {
      gameAudio.playSe('confirm')
      setInnOpen(true)
      setMessage('INN: Goldを払ってHPを全回復できる。')
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
            ? 'まだ奥へは進めない。西でBattleを重ねて、異変をもう少し確かめよう。'
            : '東の奥へ進む前に、TypeScript地方のBattleをもう少し確かめよう。',
        )
        return
      }
      enterBattle(intent.battleId, intent.region, intent.seed)
      return
    }

    setMessage(
      isVillage
        ? '静かな村だ。今は南のEXITから外へ戻れる。'
        : '近くに調べられるものはない。',
    )
  }, [
    enterBattle,
    innOpen,
    isVillage,
    position,
    progress,
    rpgState,
    setProgress,
    setRpgState,
    shopOpen,
  ])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (shopOpen || innOpen || document.body.dataset.rpgPaused === 'true') return
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
  }, [innOpen, interact, move, shopOpen])

  return (
    <main className="app-shell world-shell title-screen">
      <section className="pixel-window world-panel">
        <header className="world-header">
          <div>
            <div className="eyebrow">
              {isVillage ? 'LOCAL MAP' : 'OPEN WORLD'} //{' '}
              {isVillage ? getWorldMapLabel(mapId) : regionLabels[region]}
            </div>
            <h1>{isVillage ? 'GREENFIELD VILLAGE' : 'CODE WORLD'}</h1>
            <p>
              {isVillage
                ? 'JavaScript地方の小さな村。道を歩き、南の出口から草原へ戻れる。'
                : region === 'javascript'
                  ? javascriptStoryBrief
                  : region === 'typescript'
                    ? '東側はTypeScript地方。西とは違うruleを読みながら進む。'
                    : '中央のHubから、西のJavaScript地方と東のTypeScript地方へ進める。'}
            </p>
          </div>
        </header>

        <section
          className={`world-next-objective pixel-inner-window ${currentObjective.clear ? 'is-clear' : ''}`}
          aria-label="Next objective"
        >
          <span>{currentObjective.label}</span>
          <strong>{currentObjective.title}</strong>
          <p>{currentObjective.detail}</p>
        </section>

        <div
          className="world-viewport pixel-inner-window"
          aria-label={isVillage ? 'Village map' : 'Open world map'}
          data-world-map={mapId}
          data-world-x={position.x}
          data-world-y={position.y}
        >
          {visibleCells.map((cell) => {
            const treasure =
              cell.terrain === 'treasure' ? getTreasureAtPosition(cell, mapId) : undefined
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
                {cell.terrain === 'boss' && <span className="world-object boss-object">BOSS</span>}
                {cell.terrain === 'shop' && <span className="world-object shop-object">SHOP</span>}
                {cell.terrain === 'village' && (
                  <span className="world-object village-object">VILLAGE</span>
                )}
                {cell.terrain === 'exit' && <span className="world-object exit-object">EXIT</span>}
                {cell.terrain === 'npc' && !byteJoined && (
                  <span className="world-object npc-object" aria-label="BYTE NPC">
                    <img src={characterVisuals.byte.field} alt="" />
                  </span>
                )}
                {cell.terrain === 'recovery' && (
                  <span className="world-object recovery-object" aria-label="Inn / Rest">
                    INN
                  </span>
                )}
                {treasure && (
                  <span
                    className={`world-object treasure-object ${treasureOpened ? 'opened' : ''}`}
                    aria-label={`${treasure.id} treasure ${treasureOpened ? 'opened' : 'closed'}`}
                  >
                    {treasureOpened ? 'OPEN' : 'CHEST'}
                  </span>
                )}
              </div>
            )
          })}

          <div
            className="world-character-layer"
            aria-hidden="true"
            data-world-map={mapId}
            data-world-x={position.x}
            data-world-y={position.y}
          >
            {followerVisible && (
              <span
                className="world-follower-sprite world-character-overlay"
                style={spriteStyle(followerPosition)}
                data-world-map={mapId}
                data-world-x={followerPosition.x}
                data-world-y={followerPosition.y}
              >
                <img
                  className="world-follower-pixel"
                  src={characterVisuals.byte.field}
                  alt=""
                />
              </span>
            )}

            <span
              className="world-player-sprite world-character-overlay"
              style={spriteStyle(position)}
              data-world-map={mapId}
              data-world-x={position.x}
              data-world-y={position.y}
            >
              <img
                className="world-player-pixel"
                src={characterVisuals.player.field}
                alt=""
              />
            </span>
          </div>
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

      <WorldShop open={shopOpen} onClose={() => setShopOpen(false)} onMessage={setMessage} />
      <WorldInn open={innOpen} onClose={() => setInnOpen(false)} onMessage={setMessage} />
    </main>
  )
}

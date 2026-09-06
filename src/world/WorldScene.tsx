import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useProgress } from '../progression'
import { useRpg } from '../rpg'
import { characterVisuals } from '../rpg/visualAssets'
import { WorldLogPolicy } from './WorldLogPolicy'
import {
  getWorldNpcDefinition,
  getWorldNpcDialogue,
  getWorldNpcPlacementsForMap,
  type WorldNpcPlacement,
} from './worldCharacters'
import {
  getWorldFacing,
  getWorldScenePresentation,
  isAdjacentWorldStep,
  WORLD_ENTRY_TITLE_MS,
  WORLD_SCENE_EVENT,
  WORLD_STEP_MS,
  type WorldFacing,
  type WorldSceneEventDetail,
} from './worldPresentation'
import { TS_FRONTIER_MAP_ID, type Terrain, type WorldCell, type WorldMapId } from './worldMap'
import {
  getWorldSpriteStyle,
  isWorldPositionVisible,
  type WorldPosition,
} from './worldSceneGeometry'
import type { WorldTargetInteractionIntent } from './worldTargetInteraction'
import { useQueuedWorldMove } from './useQueuedWorldMove'

export type WorldObjective = {
  label: string
  title: string
  detail: string
  clear: boolean
}

type SpriteMotion = {
  facing: WorldFacing
  walking: boolean
  stepFrame: 0 | 1
}

type CameraPan = {
  key: string
  facing: WorldFacing
  cells: readonly WorldCell[]
}

type ActiveConversation = {
  placement: WorldNpcPlacement
  lineIndex: number
  mapId: WorldMapId
  origin: WorldPosition
}

function useWorldSpriteMotion(mapId: WorldMapId, position: WorldPosition): SpriteMotion {
  const positionX = position.x
  const positionY = position.y
  const previousRef = useRef({ mapId, position: { x: positionX, y: positionY } })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [motion, setMotion] = useState<SpriteMotion>({ facing: 'down', walking: false, stepFrame: 0 })

  useLayoutEffect(() => {
    const currentPosition = { x: positionX, y: positionY }
    const previous = previousRef.current
    const sameMap = previous.mapId === mapId
    const walked = sameMap && isAdjacentWorldStep(previous.position, currentPosition)

    if (timerRef.current !== null) clearTimeout(timerRef.current)

    if (walked) {
      setMotion((current) => ({
        facing: getWorldFacing(previous.position, currentPosition, current.facing),
        walking: true,
        stepFrame: current.stepFrame === 0 ? 1 : 0,
      }))
      timerRef.current = setTimeout(() => {
        setMotion((current) => ({ ...current, walking: false }))
        timerRef.current = null
      }, WORLD_STEP_MS)
    } else if (!sameMap || previous.position.x !== positionX || previous.position.y !== positionY) {
      setMotion((current) => ({ ...current, walking: false }))
    }

    previousRef.current = { mapId, position: currentPosition }
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [mapId, positionX, positionY])

  return motion
}

function useWorldCameraPan(
  mapId: WorldMapId,
  playerPosition: WorldPosition,
  viewportStart: WorldPosition,
  cells: readonly WorldCell[],
): CameraPan | null {
  const playerX = playerPosition.x
  const playerY = playerPosition.y
  const viewportX = viewportStart.x
  const viewportY = viewportStart.y
  const previousRef = useRef({
    mapId,
    playerPosition: { x: playerX, y: playerY },
    viewportStart: { x: viewportX, y: viewportY },
    cells,
  })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rapidUntilRef = useRef(0)
  const [pan, setPan] = useState<CameraPan | null>(null)

  useEffect(() => () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current)
  }, [])

  useLayoutEffect(() => {
    const currentPlayer = { x: playerX, y: playerY }
    const currentViewport = { x: viewportX, y: viewportY }
    const previous = previousRef.current
    const sameMap = previous.mapId === mapId
    const walked = sameMap && isAdjacentWorldStep(previous.playerPosition, currentPlayer)
    const cameraShifted = sameMap && isAdjacentWorldStep(previous.viewportStart, currentViewport)
    const now = Date.now()
    const interruptedActivePan = timerRef.current !== null

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (walked && cameraShifted) {
      if (interruptedActivePan || now < rapidUntilRef.current) {
        rapidUntilRef.current = now + WORLD_STEP_MS
        setPan(null)
      } else {
        setPan({
          key: `${mapId}:${viewportX}:${viewportY}:${playerX}:${playerY}`,
          facing: getWorldFacing(previous.playerPosition, currentPlayer),
          cells: previous.cells,
        })
        timerRef.current = setTimeout(() => {
          setPan(null)
          timerRef.current = null
        }, WORLD_STEP_MS)
      }
    } else {
      setPan(null)
      if (!sameMap) rapidUntilRef.current = 0
    }

    previousRef.current = { mapId, playerPosition: currentPlayer, viewportStart: currentViewport, cells }
  }, [cells, mapId, playerX, playerY, viewportX, viewportY])

  return pan
}

function WorldEntryTransition({ mapId }: { mapId: WorldMapId }) {
  const [visible, setVisible] = useState(true)
  const title = getWorldScenePresentation(mapId).title

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), WORLD_ENTRY_TITLE_MS)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null
  return (
    <div className="world-entry-transition" aria-hidden="true">
      <span>エリア</span>
      <strong>{title}</strong>
    </div>
  )
}

function getPlayerFieldSprite(facing: WorldFacing): string {
  if (facing === 'up') return '/pixel-art/characters/code-knight-field-up.svg'
  if (facing === 'left' || facing === 'right') return '/pixel-art/characters/code-knight-field-side.svg'
  return characterVisuals.player.field
}

function getNpcFieldVisual(npcId: string): string | null {
  if (npcId === 'trainer-mio') return characterVisuals.trainerMio.field
  if (npcId === 'type-warden') return characterVisuals.typeWarden.portrait
  return null
}

function getInteractionPresentation(intent: WorldTargetInteractionIntent): { label: string; disabled: boolean } {
  switch (intent.kind) {
    case 'npc':
      return { label: `${getWorldNpcDefinition(intent.placement).name}と話す`, disabled: false }
    case 'party':
      return { label: 'BYTEと話す', disabled: false }
    case 'shop':
      return { label: 'ショップを見る', disabled: false }
    case 'recovery':
      return { label: '宿で休む', disabled: false }
    case 'village-facility':
      return {
        label:
          intent.facility === 'inn'
            ? '宿で休む'
            : intent.facility === 'item-shop'
              ? '道具屋を見る'
              : '装備屋を見る',
        disabled: false,
      }
    case 'treasure':
      return { label: intent.opened ? '宝箱を調べる' : '宝箱を開ける', disabled: false }
    case 'training':
      return { label: intent.battleId === null ? 'MIOと話す' : 'MIOと訓練する', disabled: false }
    case 'midboss':
      return { label: intent.unlocked ? '中ボスに挑む' : '中ボスを調べる', disabled: false }
    case 'boss':
      if (intent.region === 'typescript') {
        return {
          label: intent.unlocked ? 'FRONTIER COMPILERに挑む' : 'FRONTIER COMPILERを調べる',
          disabled: false,
        }
      }
      return { label: intent.unlocked ? 'ボスに挑む' : 'ボスを調べる', disabled: false }
    case 'map-transition':
      return { label: `${intent.label}へ入る`, disabled: false }
    case 'locked-portal':
      return { label: `${intent.label}を調べる`, disabled: false }
    case 'none':
      return { label: 'アクション', disabled: true }
  }
}

const objectiveLabelReplacements: readonly [string, string][] = [
  ['ROOT CAUSE LOCATED', '根本原因を特定'],
  ['ROOT TRACE BLOCKED', '根本経路を封鎖'],
  ['SECOND SYMPTOM AHEAD', '二つ目の症状'],
  ['FOREST TRACE COMPLETE', 'Forest調査完了'],
  ['FOLLOW SHARED TRACE', '共通経路を追う'],
  ['FOLLOW THE TRACE', '経路を追う'],
  ['MISSING DATA TRACE', '欠けたデータの経路'],
  ['SHARED TRACE', '共通経路'],
  ['TRACE TRANSFORMED', 'データ変換地点'],
  ['TRACE JUNCTION', '経路の合流点'],
  ['TRACE BLOCKED', '経路封鎖'],
  ['TRACE READY', '追跡準備完了'],
  ['INCIDENT PREP', '調査準備'],
  ['LIVE INCIDENT', '実地の異常'],
  ['IMPACT RANGE', '影響範囲'],
  ['SECOND SYMPTOM', '二つ目の症状'],
  ['ROOT TRACE', '根本経路'],
  ['ROOT CAUSE', '根本原因'],
  ['FOREST LOCKED', 'Forest未開通'],
  ['FOLLOW TRACE', '経路を追う'],
  ['ALARM SIGNAL', '警報判定'],
  ['GROUP BARRIER', '全体判定'],
  ['TARGET PRIORITY', '対象の優先順'],
  ['FINAL TRACE', '最後の経路'],
  ['NEXT OBJECTIVE', '次の目的'],
  ['JAVASCRIPT CLEAR', 'JavaScript クリア'],
]

function getObjectiveLabel(label: string): string {
  let localized = label
  for (const [source, replacement] of objectiveLabelReplacements) {
    localized = localized.replace(source, replacement)
  }
  return localized
}

export function WorldObjectiveCard({ objective }: { objective: WorldObjective }) {
  return (
    <section
      className={`world-next-objective pixel-inner-window ${objective.clear ? 'is-clear' : ''}`}
      aria-label="次の目的"
      title={objective.detail}
    >
      <span>{getObjectiveLabel(objective.label)}</span>
      <strong>{objective.title}</strong>
    </section>
  )
}

export function WorldViewport(props: {
  mapId: WorldMapId
  playerPosition: WorldPosition
  cells: readonly WorldCell[]
  label: string
  className?: string
  terrainLabels: Partial<Record<Terrain, string>>
  getTerrain?: (cell: WorldCell) => Terrain
  renderObject: (cell: WorldCell, terrain: Terrain) => ReactNode
  children: ReactNode
}) {
  const scene = getWorldScenePresentation(props.mapId)
  const firstCell = props.cells[0]
  const viewportStart = firstCell ? { x: firstCell.x, y: firstCell.y } : props.playerPosition
  const cameraPan = useWorldCameraPan(props.mapId, props.playerPosition, viewportStart, props.cells)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const detail: WorldSceneEventDetail = { mapId: props.mapId, sceneId: scene.sceneId, bgmTrack: scene.bgmTrack }
    window.dispatchEvent(new CustomEvent<WorldSceneEventDetail>(WORLD_SCENE_EVENT, { detail }))
  }, [props.mapId, scene.bgmTrack, scene.sceneId])

  const renderCell = (cell: WorldCell) => {
    const terrain = props.getTerrain?.(cell) ?? cell.terrain
    const isFrontierCompiler = props.mapId === TS_FRONTIER_MAP_ID && terrain === 'boss'
    return (
      <div
        key={`${cell.mapId}:${cell.x}:${cell.y}`}
        className={`world-tile terrain-${terrain}`}
        title={props.terrainLabels[terrain] ?? terrain}
        data-world-map={cell.mapId}
        data-world-x={cell.x}
        data-world-y={cell.y}
      >
        {isFrontierCompiler ? (
          <span className="world-object boss-object" aria-label="FRONTIER COMPILER ボス">
            COMPILER
          </span>
        ) : (
          props.renderObject(cell, terrain)
        )}
      </div>
    )
  }

  const renderSnapshotTerrain = (cell: WorldCell) => {
    const terrain = props.getTerrain?.(cell) ?? cell.terrain
    return <div key={`snapshot:${cell.mapId}:${cell.x}:${cell.y}`} className={`world-tile terrain-${terrain}`} />
  }

  return (
    <div
      className={`world-viewport pixel-inner-window ${props.className ?? ''}`}
      aria-label={props.label}
      data-world-map={props.mapId}
      data-world-scene={scene.sceneId}
      data-world-bgm-track={scene.bgmTrack}
      data-world-x={props.playerPosition.x}
      data-world-y={props.playerPosition.y}
    >
      {props.cells.map(renderCell)}
      {cameraPan && (
        <div
          key={cameraPan.key}
          className="world-camera-snapshot"
          data-camera-facing={cameraPan.facing}
          aria-hidden="true"
        >
          {cameraPan.cells.map(renderSnapshotTerrain)}
        </div>
      )}
      {props.children}
      <WorldEntryTransition key={props.mapId} mapId={props.mapId} />
    </div>
  )
}

export function WorldCharacterLayer(props: {
  mapId: WorldMapId
  playerPosition: WorldPosition
  playerFacing?: WorldFacing
  viewportStart: WorldPosition
  followerPosition: WorldPosition
  followerJoined: boolean
}) {
  const { followerJoined, followerPosition, mapId, playerFacing, playerPosition, viewportStart } = props
  const playerMotion = useWorldSpriteMotion(mapId, playerPosition)
  const followerMotion = useWorldSpriteMotion(mapId, followerPosition)
  const renderedPlayerFacing = playerFacing ?? playerMotion.facing
  const worldNpcs = getWorldNpcPlacementsForMap(mapId)

  return (
    <div
      className="world-character-layer"
      aria-hidden="true"
      data-world-map={mapId}
      data-world-x={playerPosition.x}
      data-world-y={playerPosition.y}
    >
      {worldNpcs
        .filter((placement) => isWorldPositionVisible(placement.position, viewportStart))
        .map((placement) => {
          const npc = getWorldNpcDefinition(placement)
          const visual = getNpcFieldVisual(placement.npcId)
          return (
            <span
              key={`npc:${placement.npcId}`}
              className={`world-npc-sprite world-character-overlay npc-${placement.npcId}`}
              style={getWorldSpriteStyle(placement.position, viewportStart)}
              data-world-npc={placement.npcId}
              data-world-map={mapId}
              data-world-x={placement.position.x}
              data-world-y={placement.position.y}
              title={npc.name}
            >
              {visual ? (
                <img className="world-follower-pixel" src={visual} alt="" />
              ) : (
                <span className="world-resident-marker">◆</span>
              )}
            </span>
          )
        })}

      {followerJoined && isWorldPositionVisible(followerPosition, viewportStart) && (
        <span
          key={`follower:${mapId}`}
          className="world-follower-sprite world-character-overlay"
          style={getWorldSpriteStyle(followerPosition, viewportStart)}
          data-world-map={mapId}
          data-world-x={followerPosition.x}
          data-world-y={followerPosition.y}
          data-facing={followerMotion.facing}
          data-walking={followerMotion.walking || undefined}
          data-step-frame={followerMotion.stepFrame}
        >
          <img className="world-follower-pixel" src={characterVisuals.byte.field} alt="" />
        </span>
      )}

      <span
        key={`player:${mapId}`}
        className="world-player-sprite world-character-overlay"
        style={getWorldSpriteStyle(playerPosition, viewportStart)}
        data-world-map={mapId}
        data-world-x={playerPosition.x}
        data-world-y={playerPosition.y}
        data-facing={renderedPlayerFacing}
        data-walking={playerMotion.walking || undefined}
        data-step-frame={playerMotion.stepFrame}
      >
        <img className="world-player-pixel" src={getPlayerFieldSprite(renderedPlayerFacing)} alt="" />
      </span>
    </div>
  )
}

export function WorldControls(props: {
  move: (dx: number, dy: number) => void
  interact: () => void
  interactionIntent: WorldTargetInteractionIntent
  interactLabel?: string
  interactDisabled?: boolean
}) {
  const { progress } = useProgress()
  const { rpgState } = useRpg()
  const conversationalNpc =
    props.interactionIntent.kind === 'npc' ? props.interactionIntent.placement : undefined
  const inferred = getInteractionPresentation(props.interactionIntent)
  const { interact, interactLabel = inferred.label, interactDisabled = inferred.disabled, move } = props
  const [conversation, setConversation] = useState<ActiveConversation | null>(null)
  const activeConversation =
    conversation &&
    conversation.mapId === rpgState.worldMapId &&
    conversation.origin.x === rpgState.worldPosition.x &&
    conversation.origin.y === rpgState.worldPosition.y
      ? conversation
      : null
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const queuedMove = useQueuedWorldMove(move, activeConversation !== null)

  const stopHold = useCallback(() => {
    if (delayRef.current !== null) clearTimeout(delayRef.current)
    if (repeatRef.current !== null) clearInterval(repeatRef.current)
    delayRef.current = null
    repeatRef.current = null
  }, [])

  useEffect(() => stopHold, [stopHold])

  const startHold = useCallback((dx: number, dy: number) => {
    if (activeConversation) return
    stopHold()
    queuedMove(dx, dy)
    delayRef.current = setTimeout(() => {
      repeatRef.current = setInterval(() => queuedMove(dx, dy), 120)
    }, 280)
  }, [activeConversation, queuedMove, stopHold])

  const directionButton = (label: string, glyph: string, dx: number, dy: number) => (
    <button
      type="button"
      aria-label={label}
      disabled={activeConversation !== null}
      onPointerDown={(event) => {
        if (event.button !== 0) return
        startHold(dx, dy)
      }}
      onPointerUp={stopHold}
      onPointerCancel={stopHold}
      onPointerLeave={stopHold}
      onClick={(event) => {
        if (activeConversation) return
        if (event.detail !== 0) return
        queuedMove(dx, dy)
      }}
    >
      {glyph}
    </button>
  )

  const openConversation = () => {
    if (!conversationalNpc) {
      interact()
      return
    }
    setConversation({
      placement: conversationalNpc,
      lineIndex: 0,
      mapId: rpgState.worldMapId,
      origin: { ...rpgState.worldPosition },
    })
  }

  const conversationData = activeConversation
    ? getWorldNpcDialogue(activeConversation.placement, progress)
    : null
  const conversationLine = conversationData?.dialogue.lines[activeConversation?.lineIndex ?? 0]
  const isConversationLast =
    activeConversation !== null &&
    conversationData !== null &&
    activeConversation.lineIndex >= conversationData.dialogue.lines.length - 1

  const advanceConversation = () => {
    if (!activeConversation || !conversationData) return
    if (isConversationLast) {
      setConversation(null)
      return
    }
    setConversation({ ...activeConversation, lineIndex: activeConversation.lineIndex + 1 })
  }

  return (
    <div className="world-controls" aria-label="ワールド操作">
      <WorldLogPolicy />
      <div className="world-dpad">
        {directionButton('上へ移動', '▲', 0, -1)}
        {directionButton('左へ移動', '◀', -1, 0)}
        {directionButton('下へ移動', '▼', 0, 1)}
        {directionButton('右へ移動', '▶', 1, 0)}
      </div>
      <button
        type="button"
        className="primary-button world-interact"
        aria-label={interactLabel}
        onClick={openConversation}
        disabled={interactDisabled || activeConversation !== null}
      >
        {interactLabel}
      </button>

      {activeConversation && conversationData && conversationLine && (
        <section
          className="world-npc-conversation pixel-inner-window"
          role="dialog"
          aria-label={`${conversationData.npc.name}との会話`}
        >
          <div className="dialogue-speaker">
            <span>{conversationData.npc.roleLabel}</span>
            <strong>{conversationData.npc.name}</strong>
            <span className="dialogue-progress">
              {activeConversation.lineIndex + 1}/{conversationData.dialogue.lines.length}
            </span>
          </div>
          <p>{conversationLine}</p>
          <div className="dialogue-actions">
            <button type="button" className="secondary-button" onClick={() => setConversation(null)}>
              閉じる
            </button>
            <button type="button" className="primary-button" onClick={advanceConversation}>
              {isConversationLast ? '▶ 完了' : '▶ 次へ'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

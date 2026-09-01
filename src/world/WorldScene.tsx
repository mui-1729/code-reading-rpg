import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useProgress } from '../progression'
import { useRpg } from '../rpg'
import { characterVisuals } from '../rpg/visualAssets'
import { resolveWorldInteraction, type WorldInteractionIntent } from './worldActions'
import { WorldLogPolicy } from './WorldLogPolicy'
import {
  getAdjacentWorldNpc,
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
  const [pan, setPan] = useState<CameraPan | null>(null)

  useLayoutEffect(() => {
    const currentPlayer = { x: playerX, y: playerY }
    const currentViewport = { x: viewportX, y: viewportY }
    const previous = previousRef.current
    const sameMap = previous.mapId === mapId
    const walked = sameMap && isAdjacentWorldStep(previous.playerPosition, currentPlayer)
    const cameraShifted = sameMap && isAdjacentWorldStep(previous.viewportStart, currentViewport)

    if (timerRef.current !== null) clearTimeout(timerRef.current)

    if (walked && cameraShifted) {
      setPan({
        key: `${mapId}:${viewportX}:${viewportY}:${playerX}:${playerY}`,
        facing: getWorldFacing(previous.playerPosition, currentPlayer),
        cells: previous.cells,
      })
      timerRef.current = setTimeout(() => {
        setPan(null)
        timerRef.current = null
      }, WORLD_STEP_MS)
    } else {
      setPan(null)
    }

    previousRef.current = { mapId, playerPosition: currentPlayer, viewportStart: currentViewport, cells }
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
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
      <span>AREA</span>
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

function getInteractionPresentation(intent: WorldInteractionIntent): { label: string; disabled: boolean } {
  switch (intent.kind) {
    case 'party':
      return { label: 'TALK TO BYTE', disabled: false }
    case 'shop':
      return { label: 'OPEN SHOP', disabled: false }
    case 'recovery':
      return { label: 'REST AT INN', disabled: false }
    case 'treasure':
      return { label: intent.opened ? 'CHECK CHEST' : 'OPEN CHEST', disabled: false }
    case 'training':
      return { label: intent.battleId === null ? 'TALK TO MIO' : 'TRAIN WITH MIO', disabled: false }
    case 'midboss':
      return { label: intent.unlocked ? 'CHALLENGE MID BOSS' : 'CHECK MID BOSS', disabled: false }
    case 'boss':
      if (intent.region === 'typescript') {
        return {
          label: intent.unlocked ? 'CHALLENGE FRONTIER COMPILER' : 'CHECK FRONTIER COMPILER',
          disabled: false,
        }
      }
      return { label: intent.unlocked ? 'CHALLENGE BOSS' : 'CHECK BOSS', disabled: false }
    case 'none':
      return { label: 'INTERACT', disabled: true }
  }
}

export function WorldObjectiveCard({ objective }: { objective: WorldObjective }) {
  return (
    <section
      className={`world-next-objective pixel-inner-window ${objective.clear ? 'is-clear' : ''}`}
      aria-label="Next objective"
      title={objective.detail}
    >
      <span>{objective.label}</span>
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
          <span className="world-object boss-object" aria-label="Frontier Compiler Boss">
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
  viewportStart: WorldPosition
  followerPosition: WorldPosition
  followerJoined: boolean
}) {
  const { followerJoined, followerPosition, mapId, playerPosition, viewportStart } = props
  const playerMotion = useWorldSpriteMotion(mapId, playerPosition)
  const followerMotion = useWorldSpriteMotion(mapId, followerPosition)
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
        data-facing={playerMotion.facing}
        data-walking={playerMotion.walking || undefined}
        data-step-frame={playerMotion.stepFrame}
      >
        <img className="world-player-pixel" src={getPlayerFieldSprite(playerMotion.facing)} alt="" />
      </span>
    </div>
  )
}

export function WorldControls(props: {
  move: (dx: number, dy: number) => void
  interact: () => void
  interactLabel?: string
  interactDisabled?: boolean
}) {
  const { progress } = useProgress()
  const { rpgState } = useRpg()
  const baseIntent = resolveWorldInteraction(rpgState, progress)
  const adjacentNpc = getAdjacentWorldNpc(rpgState.worldMapId, rpgState.worldPosition)
  const trainingStillActive =
    adjacentNpc?.npcId === 'trainer-mio' &&
    baseIntent.kind === 'training' &&
    baseIntent.battleId !== null
  const conversationalNpc = adjacentNpc && !trainingStillActive ? adjacentNpc : undefined
  const inferred = conversationalNpc
    ? { label: `TALK TO ${getWorldNpcDefinition(conversationalNpc).name}`, disabled: false }
    : getInteractionPresentation(baseIntent)
  const { interact, interactLabel = inferred.label, interactDisabled = inferred.disabled, move } = props
  const [conversation, setConversation] = useState<ActiveConversation | null>(null)
  const activeConversation =
    conversation &&
    conversation.mapId === rpgState.worldMapId &&
    conversation.origin.x === rpgState.worldPosition.x &&
    conversation.origin.y === rpgState.worldPosition.y
      ? conversation
      : null
  const moveRef = useRef(move)
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pointerClickRef = useRef(false)

  useEffect(() => {
    moveRef.current = move
  }, [move])

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
    pointerClickRef.current = true
    moveRef.current(dx, dy)
    delayRef.current = setTimeout(() => {
      repeatRef.current = setInterval(() => moveRef.current(dx, dy), 120)
    }, 280)
  }, [activeConversation, stopHold])

  const directionButton = (label: string, glyph: string, dx: number, dy: number) => (
    <button
      type="button"
      aria-label={label}
      disabled={activeConversation !== null}
      onPointerDown={() => startHold(dx, dy)}
      onPointerUp={stopHold}
      onPointerCancel={() => {
        stopHold()
        pointerClickRef.current = false
      }}
      onPointerLeave={() => {
        stopHold()
        pointerClickRef.current = false
      }}
      onClick={() => {
        if (activeConversation) return
        if (pointerClickRef.current) {
          pointerClickRef.current = false
          return
        }
        moveRef.current(dx, dy)
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
    <div className="world-controls" aria-label="World controls">
      <WorldLogPolicy />
      <div className="world-dpad">
        {directionButton('Move up', '▲', 0, -1)}
        {directionButton('Move left', '◀', -1, 0)}
        {directionButton('Move down', '▼', 0, 1)}
        {directionButton('Move right', '▶', 1, 0)}
      </div>
      <button
        type="button"
        className="primary-button world-interact"
        aria-label={interactLabel === 'INTERACT' ? 'INTERACT' : `INTERACT · ${interactLabel}`}
        onClick={openConversation}
        disabled={interactDisabled || activeConversation !== null}
      >
        {interactLabel}
      </button>

      {activeConversation && conversationData && conversationLine && (
        <section
          className="world-npc-conversation pixel-inner-window"
          role="dialog"
          aria-label={`${conversationData.npc.name} conversation`}
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
              CLOSE
            </button>
            <button type="button" className="primary-button" onClick={advanceConversation}>
              {isConversationLast ? '▶ DONE' : '▶ NEXT'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

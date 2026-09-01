import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { characterVisuals } from '../rpg/visualAssets'
import {
  getWorldFacing,
  isAdjacentWorldStep,
  WORLD_STEP_MS,
  type WorldFacing,
} from './worldPresentation'
import type { Terrain, WorldCell, WorldMapId } from './worldMap'
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

function useWorldSpriteMotion(mapId: WorldMapId, position: WorldPosition): SpriteMotion {
  const previousRef = useRef({ mapId, position: { ...position } })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [motion, setMotion] = useState<SpriteMotion>({
    facing: 'down',
    walking: false,
    stepFrame: 0,
  })

  useLayoutEffect(() => {
    const previous = previousRef.current
    const sameMap = previous.mapId === mapId
    const walked = sameMap && isAdjacentWorldStep(previous.position, position)

    if (timerRef.current !== null) clearTimeout(timerRef.current)

    if (walked) {
      setMotion((current) => ({
        facing: getWorldFacing(previous.position, position, current.facing),
        walking: true,
        stepFrame: current.stepFrame === 0 ? 1 : 0,
      }))
      timerRef.current = setTimeout(() => {
        setMotion((current) => ({ ...current, walking: false }))
        timerRef.current = null
      }, WORLD_STEP_MS)
    } else if (!sameMap || previous.position.x !== position.x || previous.position.y !== position.y) {
      setMotion((current) => ({ ...current, walking: false }))
    }

    previousRef.current = { mapId, position: { ...position } }

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [mapId, position.x, position.y])

  return motion
}

function getPlayerFieldSprite(facing: WorldFacing): string {
  if (facing === 'up') return '/pixel-art/characters/code-knight-field-up.svg'
  if (facing === 'left' || facing === 'right') {
    return '/pixel-art/characters/code-knight-field-side.svg'
  }
  return characterVisuals.player.field
}

export function WorldObjectiveCard({ objective }: { objective: WorldObjective }) {
  return (
    <section
      className={`world-next-objective pixel-inner-window ${objective.clear ? 'is-clear' : ''}`}
      aria-label="Next objective"
    >
      <span>{objective.label}</span>
      <strong>{objective.title}</strong>
      <p>{objective.detail}</p>
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
  return (
    <div
      className={`world-viewport pixel-inner-window ${props.className ?? ''}`}
      aria-label={props.label}
      data-world-map={props.mapId}
      data-world-x={props.playerPosition.x}
      data-world-y={props.playerPosition.y}
    >
      {props.cells.map((cell) => {
        const terrain = props.getTerrain?.(cell) ?? cell.terrain
        return (
          <div
            key={`${cell.mapId}:${cell.x}:${cell.y}`}
            className={`world-tile terrain-${terrain}`}
            title={props.terrainLabels[terrain] ?? terrain}
            data-world-map={cell.mapId}
            data-world-x={cell.x}
            data-world-y={cell.y}
          >
            {props.renderObject(cell, terrain)}
          </div>
        )
      })}
      {props.children}
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

  return (
    <div
      className="world-character-layer"
      aria-hidden="true"
      data-world-map={mapId}
      data-world-x={playerPosition.x}
      data-world-y={playerPosition.y}
    >
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
        <img
          className="world-player-pixel"
          src={getPlayerFieldSprite(playerMotion.facing)}
          alt=""
        />
      </span>
    </div>
  )
}

export function WorldControls(props: {
  move: (dx: number, dy: number) => void
  interact: () => void
  interactLabel?: string
}) {
  const { interact, interactLabel = 'INTERACT', move } = props

  return (
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
        {interactLabel}
      </button>
    </div>
  )
}

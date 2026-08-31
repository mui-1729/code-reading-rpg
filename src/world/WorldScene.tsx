import type { ReactNode } from 'react'
import { characterVisuals } from '../rpg/visualAssets'
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
          className="world-follower-sprite world-character-overlay"
          style={getWorldSpriteStyle(followerPosition, viewportStart)}
          data-world-map={mapId}
          data-world-x={followerPosition.x}
          data-world-y={followerPosition.y}
        >
          <img className="world-follower-pixel" src={characterVisuals.byte.field} alt="" />
        </span>
      )}

      <span
        className="world-player-sprite world-character-overlay"
        style={getWorldSpriteStyle(playerPosition, viewportStart)}
        data-world-map={mapId}
        data-world-x={playerPosition.x}
        data-world-y={playerPosition.y}
      >
        <img className="world-player-pixel" src={characterVisuals.player.field} alt="" />
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

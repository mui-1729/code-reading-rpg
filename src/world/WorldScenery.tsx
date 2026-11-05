import type { CSSProperties } from 'react'
import { DATABASE_SHELVES } from './databaseArchive'
import {
  WORLD_BUILDINGS,
  WORLD_LOG_BRIDGES,
  type Footprint,
  type WorldBuilding,
  type WorldCellObjectKind,
} from './worldStructures'
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH, type WorldMapId } from './worldMap'
import type { WorldPosition } from './worldSceneGeometry'

function footprintStyle(bounds: Footprint, start: WorldPosition): CSSProperties {
  return {
    left: `${((bounds.left - start.x) / VIEWPORT_WIDTH) * 100}%`,
    top: `${((bounds.top - start.y) / VIEWPORT_HEIGHT) * 100}%`,
    width: `${((bounds.right - bounds.left + 1) / VIEWPORT_WIDTH) * 100}%`,
    height: `${((bounds.bottom - bounds.top + 1) / VIEWPORT_HEIGHT) * 100}%`,
  }
}

function footprintVisible(bounds: Footprint, start: WorldPosition): boolean {
  return (
    bounds.right >= start.x &&
    bounds.left < start.x + VIEWPORT_WIDTH &&
    bounds.bottom >= start.y &&
    bounds.top < start.y + VIEWPORT_HEIGHT
  )
}

// One logical pixel is shared by scenery, terrain and furniture: 16 per cell.
function BuildingArt({ building }: { building: WorldBuilding }) {
  const width = (building.bounds.right - building.bounds.left + 1) * 16
  const height = (building.bounds.bottom - building.bounds.top + 1) * 16
  const eave = Math.floor(height / 4) * 2
  const [roof, shade, light] = {
    clay: ['#b55b39', '#703b2b', '#e18b53'],
    moss: ['#5b873b', '#294d31', '#8fb84b'],
    slate: ['#527baf', '#293e68', '#8bb8cf'],
  }[building.roof]
  const doorX = building.entrance
    ? (building.entrance.x - building.bounds.left) * 16 + 8
    : width / 2
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="world-building-art"
      data-world-building={building.id}
      shapeRendering="crispEdges"
      data-building-door={
        building.entrance ? `${building.entrance.x}:${building.entrance.y}` : undefined
      }
    >
      <rect x="2" y={eave} width={width - 4} height={height - eave} fill="#282c39" />
      <rect x="4" y={eave} width={width - 8} height={height - eave - 2} fill="#e6cc91" />
      <rect x="4" y={eave} width={width - 8} height="4" fill="#a88152" />
      <rect x="4" y={height - 5} width={width - 8} height="3" fill="#a88152" />
      {[8, width - 10].map((x) => (
        <rect key={x} x={x} y={eave} width="2" height={height - eave - 2} fill="#705039" />
      ))}
      <g data-building-roof="true" fill={roof}>
        {Array.from({ length: eave / 2 }, (_, row) => {
          const inset = Math.max(0, eave - row * 2 - 2)
          return (
            <g key={row}>
              <rect x={inset} y={row * 2} width={width - inset * 2} height="2" fill={shade} />
              <rect
                x={inset + 2}
                y={row * 2}
                width={width - inset * 2 - 4}
                height="2"
                fill={row % 3 === 0 ? light : roof}
              />
            </g>
          )
        })}
        <rect x="0" y={eave - 2} width={width} height="2" fill={shade} />
      </g>
      {[14, width - 16]
        .filter((x) => Math.abs(x - doorX) > 9)
        .map((x) => (
          <g key={x}>
            <rect x={x - 4} y={eave + 5} width="10" height="10" fill="#705039" />
            <rect x={x - 2} y={eave + 6} width="6" height="7" fill="#293e68" />
            <rect x={x - 2} y={eave + 6} width="2" height="3" fill="#8bb8cf" />
            <rect x={x - 4} y={eave + 14} width="10" height="1" fill="#f4e5b3" />
          </g>
        ))}
      <rect
        data-building-entrance={building.entrance ? 'true' : undefined}
        x={doorX - 4}
        y={height - 14}
        width="8"
        height="12"
        fill="#282c39"
      />
      {building.entrance ? (
        <>
          <rect x={doorX - 3} y={height - 13} width="6" height="10" fill="#493b39" />
          <rect x={doorX + 1} y={height - 8} width="1" height="1" fill="#e6cc91" />
          <rect x={doorX - 5} y={height - 2} width="10" height="2" fill="#bab69c" />
        </>
      ) : (
        <>
          <rect x={doorX - 3} y={height - 12} width="6" height="3" fill="#a88152" />
          <rect x={doorX - 3} y={height - 7} width="6" height="3" fill="#a88152" />
        </>
      )}
    </svg>
  )
}

function ShelfArt() {
  return (
    <svg viewBox="0 0 48 32" data-world-furniture="bookshelf" shapeRendering="crispEdges">
      <rect x="1" y="1" width="46" height="31" fill="#282c39" />
      <rect x="2" y="2" width="44" height="28" fill="#705039" />
      {[4, 17].map((y) => (
        <g key={y}>
          <rect x="4" y={y} width="40" height="10" fill="#352e39" />
          {Array.from({ length: 10 }, (_, i) => (
            <g key={i}>
              <rect
                x={5 + i * 4}
                y={y + (i % 3)}
                width="3"
                height={9 - (i % 3)}
                fill={['#b55b39', '#5b873b', '#e6cc91', '#527baf'][i % 4]}
              />
              <rect x={5 + i * 4} y={y + 5} width="2" height="1" fill="#f4e5b3" />
            </g>
          ))}
          <rect x="2" y={y + 10} width="44" height="2" fill="#a88152" />
        </g>
      ))}
      <rect x="2" y="2" width="44" height="2" fill="#e6cc91" />
    </svg>
  )
}

function LogBridgeArt() {
  return (
    <svg viewBox="0 0 32 16" data-world-bridge="log" shapeRendering="crispEdges">
      <rect x="-2" y="8" width="36" height="5" fill="#293e68" />
      <rect x="-2" y="5" width="36" height="6" fill="#493b39" />
      <rect x="-2" y="6" width="36" height="4" fill="#a88152" />
      <rect x="-1" y="6" width="34" height="1" fill="#e6cc91" />
      <rect x="0" y="7" width="1" height="3" fill="#e6cc91" />
      <rect x="31" y="7" width="1" height="3" fill="#e6cc91" />
      <rect x="5" y="8" width="8" height="1" fill="#705039" />
      <rect x="18" y="9" width="7" height="1" fill="#705039" />
      <rect x="9" y="4" width="2" height="2" fill="#705039" />
      <rect x="10" y="3" width="3" height="2" fill="#5b873b" />
      <rect x="23" y="4" width="3" height="2" fill="#5b873b" />
    </svg>
  )
}

export function WorldSceneryLayer({
  mapId,
  viewportStart,
}: {
  mapId: WorldMapId
  viewportStart: WorldPosition
}) {
  return (
    <div className="world-scenery-layer" aria-hidden="true">
      {WORLD_BUILDINGS.filter(
        (building) => building.mapId === mapId && footprintVisible(building.bounds, viewportStart),
      ).map((building) => (
        <div
          key={building.id}
          className="world-structure"
          style={footprintStyle(building.bounds, viewportStart)}
        >
          <BuildingArt building={building} />
        </div>
      ))}
      {mapId === 'database-archive' &&
        DATABASE_SHELVES.filter((shelf) => footprintVisible(shelf, viewportStart)).map((shelf) => (
          <div
            key={`${shelf.left}:${shelf.top}`}
            className="world-structure"
            style={footprintStyle(shelf, viewportStart)}
          >
            <ShelfArt />
          </div>
        ))}
      {WORLD_LOG_BRIDGES.filter(
        (bridge) => bridge.mapId === mapId && footprintVisible(bridge.bounds, viewportStart),
      ).map((bridge) => (
        <div
          key={bridge.id}
          className="world-structure world-log-bridge"
          style={footprintStyle(bridge.bounds, viewportStart)}
        >
          <LogBridgeArt />
        </div>
      ))}
    </div>
  )
}

export function WorldCellObject({ kind }: { kind: WorldCellObjectKind }) {
  return (
    <svg
      className="world-cell-object"
      viewBox="0 0 16 16"
      data-scenery-object={kind}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <image href={`/pixel-art/world/${kind}.svg`} width="16" height="16" />
      {kind === 'chest' && (
        <>
          <image
            className="chest-lid-closed"
            href="/pixel-art/world/chest-closed.svg"
            width="16"
            height="16"
          />
          <image
            className="chest-lid-open"
            href="/pixel-art/world/chest-open.svg"
            width="16"
            height="16"
          />
        </>
      )}
    </svg>
  )
}

import type { CSSProperties, ReactNode } from 'react'
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

function BuildingArt({ building }: { building: WorldBuilding }) {
  const width = (building.bounds.right - building.bounds.left + 1) * 32
  const height = (building.bounds.bottom - building.bounds.top + 1) * 32
  const eave = Math.round(height * 0.48)
  const colors = {
    clay: ['#99583f', '#64382d'],
    moss: ['#647347', '#384a32'],
    slate: ['#657c91', '#37475c'],
  }[building.roof]
  const doorX = building.entrance
    ? (building.entrance.x - building.bounds.left) * 32 + 16
    : width / 2
  const roofId = `${building.id}-roof`
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="world-building-art"
      data-world-building={building.id}
      data-building-door={
        building.entrance ? `${building.entrance.x}:${building.entrance.y}` : undefined
      }
    >
      <defs>
        <clipPath id={roofId}>
          <polygon points={`0,${eave} ${width / 2},2 ${width},${eave}`} />
        </clipPath>
      </defs>
      <ellipse
        cx={width / 2}
        cy={height - 4}
        rx={width / 2 - 2}
        ry="5"
        fill="#263228"
        opacity=".45"
      />
      <rect
        x="5"
        y={eave - 2}
        width={width - 10}
        height={height - eave - 3}
        fill="#d1b586"
        stroke="#49372a"
        strokeWidth="3"
      />
      <path
        d={`M8 ${height - 11}H${width - 8}M9 ${eave + 10}H${width - 9}`}
        stroke="#9a7950"
        strokeWidth="4"
      />
      <polygon
        data-building-roof="true"
        points={`0,${eave} ${width / 2},2 ${width},${eave}`}
        fill={colors[0]}
        stroke={colors[1]}
        strokeWidth="4"
      />
      <g clipPath={`url(#${roofId})`} stroke={colors[1]} strokeWidth="2" opacity=".65">
        {[1, 2, 3, 4].map((line) => (
          <path key={line} d={`M0 ${(line * eave) / 5}H${width}`} />
        ))}
      </g>
      {[22, width - 22]
        .filter((x) => Math.abs(x - doorX) > 15)
        .map((x) => (
          <g key={x}>
            <rect
              x={x - 8}
              y={eave + 12}
              width="16"
              height="18"
              fill="#9cbfbb"
              stroke="#5e4934"
              strokeWidth="3"
            />
            <path
              d={`M${x} ${eave + 12}v18M${x - 8} ${eave + 21}h16`}
              stroke="#5e4934"
              strokeWidth="2"
            />
          </g>
        ))}
      <rect
        data-building-entrance={building.entrance ? 'true' : undefined}
        x={doorX - 9}
        y={height - 29}
        width="18"
        height="25"
        fill={building.entrance ? '#382b25' : '#806446'}
        stroke="#49372a"
        strokeWidth="3"
      />
      {building.entrance ? (
        <>
          <rect x={doorX - 12} y={height - 5} width="24" height="5" fill="#a7a68c" />
          <circle cx={doorX + 5} cy={height - 15} r="1.5" fill="#dfc77b" />
        </>
      ) : (
        <path
          d={`M${doorX - 7} ${height - 22}l14 12M${doorX - 7} ${height - 10}l14 -12`}
          stroke="#bca16d"
          strokeWidth="3"
        />
      )}
    </svg>
  )
}

function ShelfArt() {
  return (
    <svg viewBox="0 0 96 64" data-world-furniture="bookshelf">
      <rect x="3" y="4" width="90" height="57" fill="#3a2925" stroke="#281f22" strokeWidth="3" />
      <path d="M4 7H92M4 33H92M4 58H92M7 8V59M89 8V59" stroke="#a17a4e" strokeWidth="6" />
      {[13, 39].map((y) => (
        <g key={y}>
          {Array.from({ length: 10 }, (_, index) => (
            <g key={index}>
              <rect
                x={12 + index * 7}
                y={y + (index % 3)}
                width="5"
                height={17 - (index % 3)}
                fill={['#9c6562', '#799078', '#ac985a', '#7786a2'][index % 4]}
              />
              <path d={`M${13 + index * 7} ${y + 5}h3`} stroke="#d6c38f" strokeWidth="1" />
            </g>
          ))}
        </g>
      ))}
    </svg>
  )
}

function LogBridgeArt() {
  return (
    <svg viewBox="0 0 64 32" data-world-bridge="log">
      <path d="M-5 18L68 17V25L-5 26Z" fill="#254f4f" opacity=".55" />
      <path d="M-6 12L68 13V22L-6 21Z" fill="#9b7749" stroke="#493421" strokeWidth="2" />
      <path d="M-2 16L64 17M7 20L33 19M39 15L61 16" stroke="#6a4b2e" strokeWidth="1.5" />
      <path d="M-3 12V21M65 14V21" stroke="#c4a16b" strokeWidth="3" />
      <path d="M15 12l2 -4 5 1 -3 4M45 13l3 -4 4 2 -4 3" fill="#638147" stroke="#354f2e" />
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
  let art: ReactNode
  if (kind === 'stairs-up' || kind === 'stairs-down') {
    const down = kind === 'stairs-down'
    art = (
      <>
        <rect x="3" y="3" width="26" height="27" fill="#26242b" stroke="#a29885" strokeWidth="2" />
        {[0, 1, 2, 3, 4].map((step) => (
          <path
            key={step}
            d={`M${6 + (down ? step : 4 - step)} ${7 + step * 4}h${20 - 2 * (down ? step : 4 - step)}`}
            stroke={down ? '#a8a18d' : '#d1c4a1'}
            strokeWidth="3"
          />
        ))}
        <path d="M3 2V30M29 2V30" stroke="#736c61" strokeWidth="3" />
      </>
    )
  } else if (kind === 'lectern') {
    art = (
      <>
        <path d="M9 19V29M24 19V29M7 28H26" stroke="#705039" strokeWidth="4" />
        <path d="M3 7H29L26 21H6Z" fill="#9b754e" stroke="#473326" strokeWidth="2" />
        <path
          d="M6 8Q11 5 16 9Q21 5 26 8L24 18Q20 15 16 19Q11 15 8 18Z"
          fill="#e6d7a6"
          stroke="#73583e"
        />
        <path d="M16 9V19M9 11l4 1M20 11l3 -1M10 14l3 1M20 14l3 -1" stroke="#826e50" />
      </>
    )
  } else if (kind === 'chest') {
    art = (
      <>
        <rect x="5" y="15" width="23" height="12" fill="#8f5f34" stroke="#3d2e25" strokeWidth="2" />
        <path
          className="chest-lid-closed"
          d="M5 15V10Q16 2 28 10V15Z"
          fill="#ae7b43"
          stroke="#3d2e25"
          strokeWidth="2"
        />
        <path
          className="chest-lid-open"
          d="M5 14L4 3H27L28 14Z"
          fill="#5b422c"
          stroke="#d0a25c"
          strokeWidth="2"
        />
        <path d="M10 15V26M23 15V26" stroke="#d0a25c" strokeWidth="3" />
        <rect x="14" y="14" width="5" height="7" fill="#e2c17a" />
      </>
    )
  } else if (kind === 'market-stall') {
    art = (
      <>
        <path d="M5 11V28M27 11V28" stroke="#65432b" strokeWidth="3" />
        <path d="M3 4H29L31 13H1Z" fill="#527862" stroke="#293f37" strokeWidth="2" />
        <path d="M7 5l-2 8M16 4v9M25 5l2 8" stroke="#d7bd7e" strokeWidth="4" />
        <rect x="5" y="22" width="23" height="7" fill="#a27b4c" stroke="#543b27" strokeWidth="2" />
        <path d="M9 22v-5h4v5M20 22v-6h5v6" stroke="#c4b37a" strokeWidth="3" />
        <circle cx="16" cy="20" r="3" fill="#a86b4d" />
      </>
    )
  } else if (kind === 'inn' || kind === 'village') {
    art = (
      <>
        <rect x="5" y="13" width="23" height="16" fill="#d0b688" stroke="#5d4631" strokeWidth="2" />
        <path d="M1 14L16 2L31 14Z" fill="#996344" stroke="#563e2e" strokeWidth="2" />
        <rect x="13" y="18" width="6" height="11" fill="#46372a" />
        <rect x="7" y="17" width="4" height="5" fill="#b4d5cc" />
        {kind === 'inn' ? (
          <>
            <rect x="23" y="15" width="8" height="8" fill="#ebd5a5" stroke="#5d4631" />
            <path d="M24 17v4h6v-3h-4" fill="none" stroke="#806046" />
          </>
        ) : (
          <>
            <path d="M0 22L7 16L14 22M20 24l6 -6 6 6" fill="#7b8a53" stroke="#435339" />
            <rect x="2" y="22" width="8" height="7" fill="#c2ae81" />
            <rect x="24" y="24" width="6" height="5" fill="#c2ae81" />
          </>
        )}
      </>
    )
  } else {
    art = (
      <>
        <path d="M5 7V29M27 7V29" stroke="#64462d" strokeWidth="4" />
        <path d="M3 9H29" stroke="#ae8b56" strokeWidth="4" />
        <path d="M-4 16H5M27 16H36M-4 23H5M27 23H36" stroke="#9b774b" strokeWidth="3" />
        <path d="M10 28V17H22V28" fill="#a48b58" />
      </>
    )
  }
  return (
    <svg
      className="world-cell-object"
      viewBox="0 0 32 32"
      data-scenery-object={kind}
      aria-hidden="true"
    >
      {art}
    </svg>
  )
}

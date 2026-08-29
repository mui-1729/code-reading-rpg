import { useMemo, useState } from 'react'
import type { PlayerProgress } from '../progression'
import type { RpgState } from '../rpg'
import {
  getTerrain,
  getWorldMapDimensions,
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_MAP_ID,
  JS_VILLAGE_MAP_ID,
  OVERWORLD_MAP_ID,
  TS_FRONTIER_MAP_ID,
  WORLD_PORTALS,
  WORLD_TREASURES,
  type Terrain,
  type WorldMapId,
} from '../world/worldMap'

type WorldAtlasProps = {
  progress: PlayerProgress
  rpgState: RpgState
}

type AtlasMap = {
  id: WorldMapId
  label: string
  subtitle: string
  landmarks: string[]
}

type AtlasCell = {
  x: number
  y: number
  terrain: Terrain
  locked: boolean
}

const atlasMaps: AtlasMap[] = [
  {
    id: JS_DEEP_FOREST_MAP_ID,
    label: 'DEEP FOREST',
    subtitle: 'JavaScript · deepest route',
    landmarks: ['EXIT', 'DEEP CACHE', 'FINAL LESSONS'],
  },
  {
    id: JS_FOREST_MAP_ID,
    label: 'FOREST',
    subtitle: 'JavaScript · branch routes',
    landmarks: ['EXIT', 'MIDBOSS', 'FOREST SUPPLY'],
  },
  {
    id: OVERWORLD_MAP_ID,
    label: 'OVERWORLD',
    subtitle: 'Hub · crossroads',
    landmarks: ['JS BOSS', 'SHOP', 'INN', 'BYTE', 'DEBUG CACHE'],
  },
  {
    id: TS_FRONTIER_MAP_ID,
    label: 'TS FRONTIER',
    subtitle: 'TypeScript · ruins',
    landmarks: ['EXIT', 'TS BOSS', 'SUPPLY CACHE'],
  },
  {
    id: JS_VILLAGE_MAP_ID,
    label: 'GREENFIELD VILLAGE',
    subtitle: 'JavaScript · training hub',
    landmarks: ['EXIT', 'TRAINING', 'HOUSES'],
  },
]

const mapClassById: Record<WorldMapId, string> = {
  [JS_DEEP_FOREST_MAP_ID]: 'atlas-map-deep',
  [JS_FOREST_MAP_ID]: 'atlas-map-forest',
  [OVERWORLD_MAP_ID]: 'atlas-map-overworld',
  [TS_FRONTIER_MAP_ID]: 'atlas-map-typescript',
  [JS_VILLAGE_MAP_ID]: 'atlas-map-village',
}

const TERRAIN_LABEL: Partial<Record<Terrain, string>> = {
  road: 'ROAD',
  stone: 'PATH',
  town: 'TOWN',
  village: 'VILLAGE',
  gate: 'GATE',
  exit: 'EXIT',
  training: 'TRAIN',
  boss: 'BOSS',
  midboss: 'MID BOSS',
  treasure: 'TREASURE',
  shop: 'SHOP',
  recovery: 'INN',
}

function getMapGateStatus(mapId: WorldMapId, clearedStageIds: readonly number[]) {
  const entrance = WORLD_PORTALS.find(
    (portal) => portal.toMapId === mapId && portal.requiredClearedStageId !== undefined,
  )
  if (!entrance?.requiredClearedStageId) return null
  return clearedStageIds.includes(entrance.requiredClearedStageId)
    ? 'OPEN'
    : `LOCKED · CLEAR BATTLE ${entrance.requiredClearedStageId}`
}

function buildMapCells(mapId: WorldMapId, clearedStageIds: readonly number[]): AtlasCell[] {
  const dimensions = getWorldMapDimensions(mapId)
  const cells: AtlasCell[] = []

  for (let y = 0; y < dimensions.height; y += 1) {
    for (let x = 0; x < dimensions.width; x += 1) {
      const terrain = getTerrain(x, y, mapId)
      const portal = WORLD_PORTALS.find(
        (candidate) =>
          candidate.fromMapId === mapId &&
          candidate.position.x === x &&
          candidate.position.y === y,
      )
      cells.push({
        x,
        y,
        terrain,
        locked:
          portal?.requiredClearedStageId !== undefined &&
          !clearedStageIds.includes(portal.requiredClearedStageId),
      })
    }
  }

  return cells
}

function AtlasTerrainMap({
  map,
  progress,
  rpgState,
}: {
  map: AtlasMap
  progress: PlayerProgress
  rpgState: RpgState
}) {
  const dimensions = getWorldMapDimensions(map.id)
  const cells = useMemo(
    () => buildMapCells(map.id, progress.clearedStageIds),
    [map.id, progress.clearedStageIds],
  )
  const isCurrent = map.id === rpgState.worldMapId
  const gateStatus = getMapGateStatus(map.id, progress.clearedStageIds)
  const unopenedTreasureCount = WORLD_TREASURES.filter(
    (treasure) =>
      treasure.mapId === map.id && !rpgState.openedTreasureIds.includes(treasure.id),
  ).length

  return (
    <article
      className={`atlas-map ${mapClassById[map.id]} ${isCurrent ? 'is-current' : ''}`}
      data-atlas-map={map.id}
    >
      <header>
        <div>
          <strong>{map.label}</strong>
          <span>{map.subtitle}</span>
        </div>
        {isCurrent && <em>CURRENT MAP</em>}
      </header>

      <div className="atlas-map-field atlas-terrain-field" aria-label={`${map.label} terrain map`}>
        <div
          className="atlas-terrain-grid"
          style={{
            gridTemplateColumns: `repeat(${dimensions.width}, 1fr)`,
            gridTemplateRows: `repeat(${dimensions.height}, 1fr)`,
            aspectRatio: `${dimensions.width} / ${dimensions.height}`,
          }}
          data-terrain-width={dimensions.width}
          data-terrain-height={dimensions.height}
        >
          {cells.map((cell) => {
            const playerHere =
              isCurrent &&
              rpgState.worldPosition.x === cell.x &&
              rpgState.worldPosition.y === cell.y
            const label = cell.locked
              ? 'LOCKED GATE'
              : TERRAIN_LABEL[cell.terrain] ?? cell.terrain.toUpperCase()

            return (
              <span
                key={`${cell.x}:${cell.y}`}
                className={`atlas-terrain-cell terrain-${cell.terrain} ${cell.locked ? 'is-locked' : ''} ${playerHere ? 'is-player' : ''}`}
                title={`${cell.x},${cell.y} · ${label}`}
                aria-label={playerHere ? `YOU at ${cell.x}, ${cell.y}` : undefined}
                aria-hidden={playerHere ? undefined : true}
              >
                {playerHere ? '•' : ''}
              </span>
            )
          })}
        </div>
        <div className="atlas-landmark-list" aria-label={`${map.label} landmarks`}>
          {map.landmarks.map((landmark) => (
            <span key={landmark} className="atlas-landmark">◆ {landmark}</span>
          ))}
        </div>
      </div>

      <footer>
        <span>{unopenedTreasureCount > 0 ? `TREASURE ×${unopenedTreasureCount}` : 'TREASURE CHECKED'}</span>
        {gateStatus && <strong className={gateStatus === 'OPEN' ? 'is-open' : 'is-locked'}>{gateStatus}</strong>}
      </footer>
    </article>
  )
}

export function WorldAtlas({ progress, rpgState }: WorldAtlasProps) {
  const [zoom, setZoom] = useState(100)

  return (
    <section className="world-atlas" aria-label="World Atlas" data-atlas-zoom={zoom}>
      <header className="atlas-header">
        <div>
          <span className="eyebrow">WORLD ATLAS</span>
          <h3>5 REGIONS / 1 WORLD</h3>
          <p>
            CURRENT · {atlasMaps.find((map) => map.id === rpgState.worldMapId)?.label ?? rpgState.worldMapId}
            {' '}({rpgState.worldPosition.x}, {rpgState.worldPosition.y})
          </p>
        </div>
        <div className="atlas-zoom" aria-label="World Atlas zoom controls">
          <button
            type="button"
            onClick={() => setZoom((current) => Math.max(75, current - 25))}
            disabled={zoom === 75}
            aria-label="Zoom out world atlas"
          >
            −
          </button>
          <strong aria-live="polite">{zoom}%</strong>
          <button
            type="button"
            onClick={() => setZoom((current) => Math.min(150, current + 25))}
            disabled={zoom === 150}
            aria-label="Zoom in world atlas"
          >
            +
          </button>
        </div>
      </header>

      <div className="atlas-scrollport">
        <div className="atlas-canvas" style={{ width: `${zoom}%` }}>
          <div className="atlas-connection atlas-connection-deep" aria-hidden="true">←→</div>
          <div className="atlas-connection atlas-connection-forest" aria-hidden="true">←→</div>
          <div className="atlas-connection atlas-connection-ts" aria-hidden="true">←→</div>
          <div className="atlas-connection atlas-connection-village" aria-hidden="true">↕</div>

          {atlasMaps.map((map) => (
            <AtlasTerrainMap
              key={map.id}
              map={map}
              progress={progress}
              rpgState={rpgState}
            />
          ))}
        </div>
      </div>

      <div className="atlas-terrain-legend" aria-label="Terrain legend">
        <span><b className="terrain-road" />ROAD</span>
        <span><b className="terrain-woods" />WOODS</span>
        <span><b className="terrain-water" />WATER</span>
        <span><b className="terrain-gate" />GATE / EXIT</span>
        <span><b className="terrain-boss" />BOSS</span>
        <span><b className="terrain-treasure" />TREASURE</span>
        <span><b className="legend-player" />YOU</span>
      </div>
      <p className="atlas-legend">Real terrain from the playable maps · LOCKED means its entrance needs story progress.</p>
    </section>
  )
}

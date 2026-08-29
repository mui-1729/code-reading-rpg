import { useState } from 'react'
import type { PlayerProgress } from '../progression'
import type { RpgState } from '../rpg'
import {
  getWorldMapDimensions,
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_MAP_ID,
  JS_VILLAGE_MAP_ID,
  OVERWORLD_MAP_ID,
  TS_FRONTIER_MAP_ID,
  WORLD_PORTALS,
  WORLD_TREASURES,
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

const clampPercent = (value: number) => Math.max(4, Math.min(96, value))

function getMarkerStyle(mapId: WorldMapId, position: { x: number; y: number }) {
  const dimensions = getWorldMapDimensions(mapId)
  return {
    left: `${clampPercent((position.x / Math.max(1, dimensions.width - 1)) * 100)}%`,
    top: `${clampPercent((position.y / Math.max(1, dimensions.height - 1)) * 100)}%`,
  }
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

          {atlasMaps.map((map) => {
            const isCurrent = map.id === rpgState.worldMapId
            const gateStatus = getMapGateStatus(map.id, progress.clearedStageIds)
            const unopenedTreasureCount = WORLD_TREASURES.filter(
              (treasure) =>
                treasure.mapId === map.id && !rpgState.openedTreasureIds.includes(treasure.id),
            ).length

            return (
              <article
                key={map.id}
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

                <div className="atlas-map-field" aria-label={`${map.label} landmarks`}>
                  {map.landmarks.map((landmark) => (
                    <span key={landmark} className="atlas-landmark">◆ {landmark}</span>
                  ))}
                  {isCurrent && (
                    <span
                      className="atlas-player-marker"
                      style={getMarkerStyle(map.id, rpgState.worldPosition)}
                      aria-label={`YOU at ${rpgState.worldPosition.x}, ${rpgState.worldPosition.y}`}
                    >
                      YOU
                    </span>
                  )}
                </div>

                <footer>
                  <span>{unopenedTreasureCount > 0 ? `TREASURE ×${unopenedTreasureCount}` : 'TREASURE CHECKED'}</span>
                  {gateStatus && <strong className={gateStatus === 'OPEN' ? 'is-open' : 'is-locked'}>{gateStatus}</strong>}
                </footer>
              </article>
            )
          })}
        </div>
      </div>

      <p className="atlas-legend">◆ LANDMARK · YOU CURRENT POSITION · LOCKED means its entrance needs story progress.</p>
    </section>
  )
}

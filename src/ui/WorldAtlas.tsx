import { useMemo, useState } from 'react'
import type { PlayerProgress } from '../progression'
import { areBattlePrerequisitesMet, getBattleDisplayCode } from '../progression/progressionGraph'
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
}

type AtlasCell = {
  x: number
  y: number
  terrain: Terrain
  locked: boolean
}

type AtlasLandmark = {
  id: string
  x: number
  y: number
  kind: 'exit' | 'boss' | 'midboss' | 'treasure' | 'shop' | 'inn' | 'training' | 'village'
  label: string
  opened?: boolean
}

const ATLAS_BASE_WIDTH = 650

const atlasMaps: AtlasMap[] = [
  { id: OVERWORLD_MAP_ID, label: 'OVERWORLD', subtitle: 'Hub · crossroads' },
  { id: JS_VILLAGE_MAP_ID, label: 'GREENFIELD VILLAGE', subtitle: 'JavaScript · village' },
  { id: JS_FOREST_MAP_ID, label: 'FOREST', subtitle: 'JavaScript · branch routes' },
  { id: JS_DEEP_FOREST_MAP_ID, label: 'DEEP FOREST', subtitle: 'JavaScript · deepest route' },
  { id: TS_FRONTIER_MAP_ID, label: 'TS FRONTIER', subtitle: 'TypeScript · frontier' },
]

const TERRAIN_GLYPH: Partial<Record<Terrain, string>> = {
  mountain: '▲',
  water: '≈',
  road: '·',
  stone: '·',
  crystal: '◇',
  ruins: '#',
  grass: '·',
  'tall-grass': '⌁',
  woods: '♠',
  'deep-woods': '♠',
  forest: '♠',
  town: '▪',
  village: '⌂',
}

const LANDMARK_BY_TERRAIN: Partial<Record<Terrain, Pick<AtlasLandmark, 'kind' | 'label'>>> = {
  gate: { kind: 'exit', label: 'GATE' },
  exit: { kind: 'exit', label: 'EXIT' },
  boss: { kind: 'boss', label: 'BOSS' },
  midboss: { kind: 'midboss', label: 'MID BOSS' },
  treasure: { kind: 'treasure', label: 'TREASURE' },
  shop: { kind: 'shop', label: 'SHOP' },
  recovery: { kind: 'inn', label: 'INN' },
  training: { kind: 'training', label: 'TRAINING' },
  village: { kind: 'village', label: 'VILLAGE' },
}

function isRequiredStageSatisfied(
  requiredStageId: number,
  clearedStageIds: readonly number[],
): boolean {
  return (
    clearedStageIds.includes(requiredStageId) &&
    areBattlePrerequisitesMet(requiredStageId, clearedStageIds)
  )
}

function getMapGateStatus(mapId: WorldMapId, clearedStageIds: readonly number[]) {
  const entrance = WORLD_PORTALS.find(
    (portal) => portal.toMapId === mapId && portal.requiredClearedStageId !== undefined,
  )
  if (!entrance?.requiredClearedStageId) return null

  if (isRequiredStageSatisfied(entrance.requiredClearedStageId, clearedStageIds)) return 'OPEN'
  const displayCode = getBattleDisplayCode(entrance.requiredClearedStageId)
  return `LOCKED · CLEAR ${displayCode ?? 'STORY PROGRESS'}`
}

function isMapDiscovered(
  mapId: WorldMapId,
  progress: PlayerProgress,
  rpgState: RpgState,
): boolean {
  if (mapId === rpgState.worldMapId || mapId === OVERWORLD_MAP_ID) return true
  const gate = getMapGateStatus(mapId, progress.clearedStageIds)
  return gate === null || gate === 'OPEN'
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
          !isRequiredStageSatisfied(portal.requiredClearedStageId, clearedStageIds),
      })
    }
  }
  return cells
}

function buildLandmarks(
  mapId: WorldMapId,
  cells: readonly AtlasCell[],
  openedTreasureIds: readonly string[],
): AtlasLandmark[] {
  const landmarks: AtlasLandmark[] = []
  for (const cell of cells) {
    const definition = LANDMARK_BY_TERRAIN[cell.terrain]
    if (!definition) continue
    if (cell.terrain === 'treasure') {
      const treasure = WORLD_TREASURES.find(
        (candidate) => candidate.mapId === mapId && candidate.position.x === cell.x && candidate.position.y === cell.y,
      )
      landmarks.push({
        id: treasure?.id ?? `${mapId}:treasure:${cell.x}:${cell.y}`,
        x: cell.x,
        y: cell.y,
        ...definition,
        label: treasure ? 'TREASURE' : definition.label,
        opened: treasure ? openedTreasureIds.includes(treasure.id) : false,
      })
      continue
    }
    landmarks.push({ id: `${mapId}:${cell.terrain}:${cell.x}:${cell.y}`, x: cell.x, y: cell.y, ...definition })
  }
  return landmarks
}

function AtlasTerrainMap({ map, progress, rpgState }: { map: AtlasMap; progress: PlayerProgress; rpgState: RpgState }) {
  const dimensions = getWorldMapDimensions(map.id)
  const cells = useMemo(
    () => buildMapCells(map.id, progress.clearedStageIds),
    [map.id, progress.clearedStageIds],
  )
  const landmarks = useMemo(
    () => buildLandmarks(map.id, cells, rpgState.openedTreasureIds),
    [cells, map.id, rpgState.openedTreasureIds],
  )
  const isCurrent = map.id === rpgState.worldMapId
  const gateStatus = getMapGateStatus(map.id, progress.clearedStageIds)

  return (
    <article className={`atlas-map atlas-map-detail ${isCurrent ? 'is-current' : ''}`} data-atlas-map={map.id}>
      <header>
        <div>
          <strong>{map.label}</strong>
          <span>{map.subtitle}</span>
        </div>
        {isCurrent && <em>CURRENT</em>}
      </header>

      <div className="atlas-terrain-field">
        <div className="atlas-terrain-stage" aria-label={`${map.label} terrain map`}>
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
              const playerHere = isCurrent && rpgState.worldPosition.x === cell.x && rpgState.worldPosition.y === cell.y
              return (
                <span
                  key={`${cell.x}:${cell.y}`}
                  className={`atlas-terrain-cell terrain-${cell.terrain} ${cell.locked ? 'is-locked' : ''} ${playerHere ? 'is-player' : ''}`}
                  aria-label={playerHere ? 'YOU' : undefined}
                  aria-hidden={playerHere ? undefined : true}
                >
                  {playerHere ? '●' : TERRAIN_GLYPH[cell.terrain] ?? ''}
                </span>
              )
            })}
          </div>

          <div className="atlas-landmark-layer" aria-label={`${map.label} landmarks`}>
            {landmarks.map((landmark) => (
              <span
                key={landmark.id}
                className={`atlas-landmark-pin is-${landmark.kind} ${landmark.opened ? 'is-opened' : ''}`}
                style={{
                  left: `${((landmark.x + 0.5) / dimensions.width) * 100}%`,
                  top: `${((landmark.y + 0.5) / dimensions.height) * 100}%`,
                }}
                data-atlas-landmark={landmark.kind}
                aria-label={`${landmark.label}${landmark.opened ? ' · OPENED' : ''}`}
                title={landmark.label}
              >
                {landmark.kind === 'exit'
                  ? '↔'
                  : landmark.kind === 'boss'
                    ? '★'
                    : landmark.kind === 'midboss'
                      ? '⚔'
                      : landmark.kind === 'treasure'
                        ? '◆'
                        : landmark.kind === 'shop'
                          ? '$'
                          : landmark.kind === 'inn'
                            ? '✚'
                            : landmark.kind === 'training'
                              ? '!' 
                              : '⌂'}
              </span>
            ))}
          </div>
        </div>
      </div>

      <footer>
        <span>{landmarks.filter((landmark) => !landmark.opened).length} LANDMARKS ACTIVE</span>
        {gateStatus && <strong className={gateStatus === 'OPEN' ? 'is-open' : 'is-locked'}>{gateStatus}</strong>}
      </footer>
    </article>
  )
}

export function WorldAtlas({ progress, rpgState }: WorldAtlasProps) {
  const [selectedMapId, setSelectedMapId] = useState<WorldMapId>(rpgState.worldMapId)
  const [zoom, setZoom] = useState(100)
  const [fit, setFit] = useState(true)
  const selectedMap = atlasMaps.find((map) => map.id === selectedMapId) ?? atlasMaps[0]
  const detailWidth = fit ? '100%' : `${ATLAS_BASE_WIDTH * (zoom / 100)}px`

  return (
    <section className="world-atlas" aria-label="World Atlas" data-atlas-zoom={fit ? 'fit' : zoom}>
      <header className="atlas-header">
        <div>
          <span className="eyebrow">WORLD ATLAS</span>
          <h3>DISCOVERED REGIONS</h3>
          <p>CURRENT · {atlasMaps.find((map) => map.id === rpgState.worldMapId)?.label ?? 'UNKNOWN'}</p>
        </div>
        <div className="atlas-zoom" aria-label="World Atlas zoom controls">
          <button type="button" className={fit ? 'is-active' : ''} onClick={() => setFit(true)}>FIT</button>
          <button type="button" onClick={() => { setFit(false); setZoom(100) }}>100%</button>
          <button
            type="button"
            aria-label="Zoom out world atlas"
            onClick={() => { setFit(false); setZoom((current) => Math.max(75, current - 25)) }}
            disabled={!fit && zoom === 75}
          >−</button>
          <button
            type="button"
            aria-label="Zoom in world atlas"
            onClick={() => { setFit(false); setZoom((current) => Math.min(150, current + 25)) }}
            disabled={!fit && zoom === 150}
          >+</button>
        </div>
      </header>

      <nav className="atlas-region-nav" aria-label="World Atlas regions">
        {atlasMaps.map((map) => {
          const discovered = isMapDiscovered(map.id, progress, rpgState)
          const current = map.id === rpgState.worldMapId
          const selected = map.id === selectedMapId
          return (
            <button
              key={map.id}
              type="button"
              className={`${selected ? 'is-selected' : ''} ${current ? 'is-current' : ''}`}
              data-atlas-region={map.id}
              disabled={!discovered}
              aria-pressed={selected}
              onClick={() => setSelectedMapId(map.id)}
            >
              <strong>{discovered ? map.label : 'UNKNOWN REGION'}</strong>
              <span>{current ? 'CURRENT' : discovered ? map.subtitle : 'Not discovered yet'}</span>
            </button>
          )
        })}
      </nav>

      <div className="atlas-scrollport">
        <div className="atlas-detail-canvas" style={{ width: detailWidth }}>
          <AtlasTerrainMap map={selectedMap} progress={progress} rpgState={rpgState} />
        </div>
      </div>

      <div className="atlas-terrain-legend" aria-label="Terrain legend">
        <span><b>·</b>PATH</span>
        <span><b>♠</b>WOODS</span>
        <span><b>≈</b>WATER</span>
        <span><b>◇</b>CRYSTAL</span>
        <span><b>↔</b>EXIT</span>
        <span><b>★</b>BOSS</span>
        <span><b>◆</b>TREASURE</span>
        <span><b>●</b>YOU</span>
      </div>
      <p className="atlas-legend">Only discovered routes are named. Select a region to inspect its landmarks.</p>
    </section>
  )
}

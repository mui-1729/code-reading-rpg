import { useMemo, useState, type CSSProperties } from 'react'
import type { PlayerProgress } from '../progression'
import type { RpgState } from '../rpg'
import {
  getTerrain,
  getWorldMapDimensions,
  getWorldMapLabel,
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_MAP_ID,
  JS_VILLAGE_MAP_ID,
  OVERWORLD_MAP_ID,
  TS_FRONTIER_MAP_ID,
  WORLD_PORTALS,
  type Terrain,
  type WorldMapId,
} from '../world/worldMap'

const MAP_ORDER: WorldMapId[] = [
  JS_VILLAGE_MAP_ID,
  OVERWORLD_MAP_ID,
  JS_FOREST_MAP_ID,
  JS_DEEP_FOREST_MAP_ID,
  TS_FRONTIER_MAP_ID,
]

const MAP_HELP: Record<WorldMapId, string> = {
  [OVERWORLD_MAP_ID]: '中央Hub。JavaScript地方とTypeScript地方をつなぐ起点。',
  [JS_VILLAGE_MAP_ID]: '最初の村。TRAINでJavaScriptの基礎を学ぶ。',
  [JS_FOREST_MAP_ID]: 'VillageのTraining 9後にOverworld西側から入れる森。',
  [JS_DEEP_FOREST_MAP_ID]: 'ForestのBattle 14後にさらに西へ進むと入れる深い森。',
  [TS_FRONTIER_MAP_ID]: 'JavaScript Boss 3撃破後、Overworld東側のGATEから入れる。',
}

const TERRAIN_LABEL: Partial<Record<Terrain, string>> = {
  road: 'ROAD',
  stone: 'PATH',
  town: 'TOWN',
  village: 'VILLAGE',
  exit: 'EXIT',
  gate: 'GATE',
  training: 'TRAIN',
  boss: 'BOSS',
  midboss: 'MID BOSS',
  treasure: 'TREASURE',
  shop: 'SHOP',
  recovery: 'INN',
}

function getTileTitle(terrain: Terrain, locked: boolean) {
  if (locked) return 'LOCKED GATE'
  return TERRAIN_LABEL[terrain] ?? terrain.toUpperCase()
}

function AtlasMap({
  mapId,
  rpgState,
  progress,
}: {
  mapId: WorldMapId
  rpgState: RpgState
  progress: PlayerProgress
}) {
  const dimensions = getWorldMapDimensions(mapId)
  const cells = useMemo(() => {
    const next = []
    for (let y = 0; y < dimensions.height; y += 1) {
      for (let x = 0; x < dimensions.width; x += 1) {
        const terrain = getTerrain(x, y, mapId)
        const portal = WORLD_PORTALS.find(
          (candidate) =>
            candidate.fromMapId === mapId &&
            candidate.position.x === x &&
            candidate.position.y === y,
        )
        const locked =
          portal?.requiredClearedStageId !== undefined &&
          !progress.clearedStageIds.includes(portal.requiredClearedStageId)
        next.push({ x, y, terrain, locked })
      }
    }
    return next
  }, [dimensions.height, dimensions.width, mapId, progress.clearedStageIds])

  const isCurrentMap = rpgState.worldMapId === mapId

  return (
    <article
      className={`world-atlas-card pixel-inner-window ${isCurrentMap ? 'is-current' : ''}`}
      data-atlas-map={mapId}
    >
      <header className="world-atlas-card-header">
        <div>
          <span>{isCurrentMap ? 'YOU ARE HERE' : 'AREA MAP'}</span>
          <strong>{getWorldMapLabel(mapId)}</strong>
        </div>
        <em>{dimensions.width}×{dimensions.height}</em>
      </header>

      <p>{MAP_HELP[mapId]}</p>

      <div className="world-atlas-map-scroll">
        <div
          className="world-atlas-map-grid"
          style={{
            gridTemplateColumns: `repeat(${dimensions.width}, var(--atlas-cell))`,
            gridTemplateRows: `repeat(${dimensions.height}, var(--atlas-cell))`,
          }}
          role="img"
          aria-label={`${getWorldMapLabel(mapId)} overview`}
        >
          {cells.map((cell) => {
            const current =
              isCurrentMap &&
              rpgState.worldPosition.x === cell.x &&
              rpgState.worldPosition.y === cell.y
            return (
              <span
                key={`${cell.x}:${cell.y}`}
                className={`world-atlas-tile terrain-${cell.terrain} ${cell.locked ? 'is-locked' : ''} ${current ? 'is-player' : ''}`}
                title={`${cell.x},${cell.y} · ${getTileTitle(cell.terrain, cell.locked)}`}
                aria-hidden="true"
              />
            )
          })}
        </div>
      </div>
    </article>
  )
}

export function WorldAtlas({ rpgState, progress }: { rpgState: RpgState; progress: PlayerProgress }) {
  const [zoom, setZoom] = useState(100)
  const atlasStyle = { '--atlas-zoom': zoom / 100 } as CSSProperties

  const updateZoom = (value: number) => setZoom(Math.min(200, Math.max(50, value)))

  return (
    <section className="pause-section world-atlas" aria-label="World Atlas" style={atlasStyle}>
      <header className="world-atlas-toolbar pixel-inner-window">
        <div>
          <span>WORLD ATLAS</span>
          <strong>{getWorldMapLabel(rpgState.worldMapId)}</strong>
          <p>
            現在地を確認しながら、地域どうしの接続とランドマークを見られます。
          </p>
        </div>
        <div className="world-atlas-zoom" aria-label="Map zoom controls">
          <button type="button" onClick={() => updateZoom(zoom - 25)} aria-label="Zoom out map">−</button>
          <label>
            <span>ZOOM {zoom}%</span>
            <input
              type="range"
              min="50"
              max="200"
              step="25"
              value={zoom}
              onChange={(event) => updateZoom(Number(event.target.value))}
              aria-label="Map zoom"
            />
          </label>
          <button type="button" onClick={() => updateZoom(zoom + 25)} aria-label="Zoom in map">＋</button>
        </div>
      </header>

      <div className="world-atlas-route" aria-label="World route overview">
        <span>GREENFIELD VILLAGE</span>
        <b>→</b>
        <span>CENTRAL OVERWORLD</span>
        <b>→</b>
        <span>JAVASCRIPT FOREST</span>
        <b>→</b>
        <span>DEEP FOREST</span>
        <i>OVERWORLD → TYPESCRIPT FRONTIER</i>
      </div>

      <div className="world-atlas-legend" aria-label="Map legend">
        <span><b className="legend-player" />YOU</span>
        <span><b className="legend-road" />ROAD</span>
        <span><b className="legend-landmark" />LANDMARK</span>
        <span><b className="legend-treasure" />TREASURE</span>
        <span><b className="legend-locked" />LOCKED</span>
      </div>

      <div className="world-atlas-grid">
        {MAP_ORDER.map((mapId) => (
          <AtlasMap key={mapId} mapId={mapId} rpgState={rpgState} progress={progress} />
        ))}
      </div>
    </section>
  )
}

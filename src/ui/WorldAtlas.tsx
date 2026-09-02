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

type AtlasRoute = {
  id: string
  from: AtlasMap
  to: AtlasMap
  locked: boolean
  requirement: string | null
}

const ATLAS_BASE_WIDTH = 650
const OPEN_GATE_LABEL = '開通'

const atlasMaps: AtlasMap[] = [
  { id: OVERWORLD_MAP_ID, label: 'JavaScript草原', subtitle: 'Hub · 交差点' },
  { id: JS_VILLAGE_MAP_ID, label: 'グリーンフィールド村', subtitle: 'JavaScript · 村' },
  { id: JS_FOREST_MAP_ID, label: 'JavaScriptの森', subtitle: 'JavaScript · 分岐路' },
  { id: JS_DEEP_FOREST_MAP_ID, label: 'JavaScript深層の森', subtitle: 'JavaScript · 最深部' },
  { id: TS_FRONTIER_MAP_ID, label: 'TypeScript辺境', subtitle: 'TypeScript · 辺境' },
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
  gate: { kind: 'exit', label: '門' },
  exit: { kind: 'exit', label: '出口' },
  boss: { kind: 'boss', label: 'ボス' },
  midboss: { kind: 'midboss', label: '中ボス' },
  treasure: { kind: 'treasure', label: '宝箱' },
  shop: { kind: 'shop', label: 'ショップ' },
  recovery: { kind: 'inn', label: '宿' },
  training: { kind: 'training', label: '訓練所' },
  village: { kind: 'village', label: '村' },
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

  if (isRequiredStageSatisfied(entrance.requiredClearedStageId, clearedStageIds)) return OPEN_GATE_LABEL
  const displayCode = getBattleDisplayCode(entrance.requiredClearedStageId)
  return `未開通 · ${displayCode ?? 'ストーリー進行'}をクリア`
}

function isMapDiscovered(
  mapId: WorldMapId,
  progress: PlayerProgress,
  rpgState: RpgState,
): boolean {
  if (mapId === rpgState.worldMapId || mapId === OVERWORLD_MAP_ID) return true
  const gate = getMapGateStatus(mapId, progress.clearedStageIds)
  return gate === null || gate === OPEN_GATE_LABEL
}

function getDiscoveredRoutes(progress: PlayerProgress, rpgState: RpgState): AtlasRoute[] {
  const mapById = new Map(atlasMaps.map((map) => [map.id, map]))
  const seen = new Set<string>()
  const routes: AtlasRoute[] = []

  for (const portal of WORLD_PORTALS) {
    const from = mapById.get(portal.fromMapId)
    const to = mapById.get(portal.toMapId)
    if (!from || !to) continue
    if (!isMapDiscovered(from.id, progress, rpgState) || !isMapDiscovered(to.id, progress, rpgState)) continue

    const pair = [from.id, to.id].sort().join(':')
    if (seen.has(pair)) continue
    seen.add(pair)

    const locked =
      portal.requiredClearedStageId !== undefined &&
      !isRequiredStageSatisfied(portal.requiredClearedStageId, progress.clearedStageIds)
    routes.push({
      id: pair,
      from,
      to,
      locked,
      requirement: portal.requiredClearedStageId
        ? getBattleDisplayCode(portal.requiredClearedStageId) ?? `ステージ ${portal.requiredClearedStageId}`
        : null,
    })
  }

  return routes
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
        label: treasure ? '宝箱' : definition.label,
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
        {isCurrent && <em>現在地</em>}
      </header>

      <div className="atlas-terrain-field">
        <div className="atlas-terrain-stage" aria-label={`${map.label} 地形マップ`}>
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
                  aria-label={playerHere ? '現在地' : undefined}
                  aria-hidden={playerHere ? undefined : true}
                >
                  {playerHere ? '●' : TERRAIN_GLYPH[cell.terrain] ?? ''}
                </span>
              )
            })}
          </div>

          <div className="atlas-landmark-layer" aria-label={`${map.label} の目印`}>
            {landmarks.map((landmark) => (
              <span
                key={landmark.id}
                className={`atlas-landmark-pin is-${landmark.kind} ${landmark.opened ? 'is-opened' : ''}`}
                style={{
                  left: `${((landmark.x + 0.5) / dimensions.width) * 100}%`,
                  top: `${((landmark.y + 0.5) / dimensions.height) * 100}%`,
                }}
                data-atlas-landmark={landmark.kind}
                aria-label={`${landmark.label}${landmark.opened ? ' · 開封済み' : ''}`}
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
        <span>未確認の目印 {landmarks.filter((landmark) => !landmark.opened).length}</span>
        {gateStatus && <strong className={gateStatus === OPEN_GATE_LABEL ? 'is-open' : 'is-locked'}>{gateStatus}</strong>}
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
  const routes = useMemo(() => getDiscoveredRoutes(progress, rpgState), [progress, rpgState])

  return (
    <section className="world-atlas" aria-label="ワールドマップ" data-atlas-zoom={fit ? 'fit' : zoom}>
      <header className="atlas-header">
        <div>
          <span className="eyebrow">ワールドマップ</span>
          <h3>発見済みエリア</h3>
          <p>現在地 · {atlasMaps.find((map) => map.id === rpgState.worldMapId)?.label ?? '不明'}</p>
        </div>
        <div className="atlas-zoom" aria-label="ワールドマップ倍率">
          <button type="button" className={fit ? 'is-active' : ''} onClick={() => setFit(true)}>全体</button>
          <button type="button" onClick={() => { setFit(false); setZoom(100) }}>100%</button>
          <button
            type="button"
            aria-label="ワールドマップを縮小"
            onClick={() => { setFit(false); setZoom((current) => Math.max(75, current - 25)) }}
            disabled={!fit && zoom === 75}
          >−</button>
          <button
            type="button"
            aria-label="ワールドマップを拡大"
            onClick={() => { setFit(false); setZoom((current) => Math.min(150, current + 25)) }}
            disabled={!fit && zoom === 150}
          >+</button>
        </div>
      </header>

      <nav className="atlas-region-nav" aria-label="ワールドマップのエリア">
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
              <strong>{discovered ? map.label : '未発見エリア'}</strong>
              <span>{current ? '現在地' : discovered ? map.subtitle : 'まだ発見していない'}</span>
            </button>
          )
        })}
      </nav>

      <section className="atlas-route-network" aria-label="発見済みエリアのつながり">
        <strong className="atlas-route-title">エリアのつながり</strong>
        <div className="atlas-route-list">
          {routes.map((route) => (
            <span className={`atlas-route ${route.locked ? 'is-locked' : 'is-open'}`} key={route.id}>
              <b>{route.from.label}</b>
              <span aria-hidden="true">↔</span>
              <b>{route.to.label}</b>
              <small>{route.locked ? `未開通 · ${route.requirement ?? 'ストーリー進行'}` : '接続済み'}</small>
            </span>
          ))}
        </div>
      </section>

      <div className="atlas-scrollport">
        <div className="atlas-detail-canvas" style={{ width: detailWidth }}>
          <AtlasTerrainMap map={selectedMap} progress={progress} rpgState={rpgState} />
        </div>
      </div>

      <div className="atlas-terrain-legend" aria-label="地形の凡例">
        <span><b>·</b>道</span>
        <span><b>♠</b>森</span>
        <span><b>≈</b>水</span>
        <span><b>◇</b>クリスタル</span>
        <span><b>↔</b>出口</span>
        <span><b>★</b>ボス</span>
        <span><b>◆</b>宝箱</span>
        <span><b>●</b>現在地</span>
      </div>
      <p className="atlas-legend">発見済みの経路だけ名前を表示します。エリアを選ぶと目印を確認できます。</p>
    </section>
  )
}

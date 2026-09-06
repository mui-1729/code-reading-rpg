export const TS_FRONTIER_OUTPOST_LABEL = '境界監視所' as const

export const TS_FRONTIER_OUTPOST_CHECKPOINT_POSITION = { x: 8, y: 10 } as const
export const TS_FRONTIER_OUTPOST_SHOP_POSITION = { x: 7, y: 9 } as const
export const TS_FRONTIER_OUTPOST_INN_POSITION = { x: 7, y: 11 } as const
export const TS_FRONTIER_OUTPOST_WARDEN_POSITION = { x: 9, y: 9 } as const

const TS_FRONTIER_OUTPOST_ROAD_MIN_X = 6
const TS_FRONTIER_OUTPOST_ROAD_MAX_X = 11
const TS_FRONTIER_OUTPOST_ROAD_Y = 10

export function isTypeScriptFrontierOutpostRoad(position: { x: number; y: number }): boolean {
  return (
    position.y === TS_FRONTIER_OUTPOST_ROAD_Y &&
    position.x >= TS_FRONTIER_OUTPOST_ROAD_MIN_X &&
    position.x <= TS_FRONTIER_OUTPOST_ROAD_MAX_X
  )
}

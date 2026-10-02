import { describe, expect, it } from 'vitest'
import { GREENFIELD_DIMENSIONS, GREENFIELD_EQUIPMENT_SHOP, GREENFIELD_RIVERSIDE_CHEST, GREENFIELD_TRAVELER } from './greenfieldLayout'
import { getTerrain, isWalkableTerrain, isEncounterTerrain, JS_VILLAGE_MAP_ID, WORLD_MAP_STARTS } from './worldMap'
import { VILLAGE_FACILITIES } from './villageFacilityData'
import { WORLD_NPC_PLACEMENTS } from './worldCharacters'

describe('Greenfield walking routes', () => {
  it('旧saveの入口から全施設・住人・川辺Treasureへ歩け、村内にRandom Encounterを置かない', () => {
    const start = WORLD_MAP_STARTS[JS_VILLAGE_MAP_ID]
    expect(start).toEqual({ x: 10, y: 12 })
    const distances = new Map([[`${start.x}:${start.y}`, 0]])
    const queue = [start]
    for (let index = 0; index < queue.length; index += 1) {
      const point = queue[index]
      const distance = distances.get(`${point.x}:${point.y}`)!
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const next = { x: point.x + dx, y: point.y + dy }
        const key = `${next.x}:${next.y}`
        if (next.x < 0 || next.y < 0 || next.x >= GREENFIELD_DIMENSIONS.width || next.y >= GREENFIELD_DIMENSIONS.height) continue
        const terrain = getTerrain(next.x, next.y, JS_VILLAGE_MAP_ID)
        expect(isEncounterTerrain(terrain)).toBe(false)
        if (!isWalkableTerrain(terrain) || distances.has(key)) continue
        distances.set(key, distance + 1)
        queue.push(next)
      }
    }
    const destinations = [
      ...VILLAGE_FACILITIES.filter((facility) => facility.mapId === JS_VILLAGE_MAP_ID).map((facility) => facility.position),
      ...WORLD_NPC_PLACEMENTS.filter((npc) => npc.mapId === JS_VILLAGE_MAP_ID).map((npc) => npc.position),
      GREENFIELD_RIVERSIDE_CHEST,
    ]
    for (const point of destinations) {
      expect([[0, -1], [1, 0], [0, 1], [-1, 0]].some(([dx, dy]) => distances.has(`${point.x + dx}:${point.y + dy}`))).toBe(true)
    }
    expect(distances.get(`${GREENFIELD_EQUIPMENT_SHOP.x}:${GREENFIELD_EQUIPMENT_SHOP.y + 1}`)).toBeGreaterThan(15)
    expect(distances.get(`${GREENFIELD_TRAVELER.x - 1}:${GREENFIELD_TRAVELER.y}`)).toBeGreaterThan(10)
  })

  it('住宅街→工房→川辺→入口を接続する周回路を持つ', () => {
    const corners = [{x:8,y:14},{x:20,y:14},{x:20,y:19},{x:8,y:19}]
    for (let index=0; index<corners.length; index+=1) {
      const from=corners[index]
      const to=corners[(index+1)%corners.length]
      const dx=Math.sign(to.x-from.x)
      const dy=Math.sign(to.y-from.y)
      for(let x=from.x,y=from.y; x!==to.x || y!==to.y; x+=dx,y+=dy) {
        expect(getTerrain(x,y,JS_VILLAGE_MAP_ID)).toBe(x === 10 && y === 14 ? 'exit' : 'road')
      }
    }
  })
})

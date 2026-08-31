import { describe, expect, it } from 'vitest'
import { areas } from '../game/areas'
import { equipmentById } from './equipment'
import { grantAreaClearEquipment } from './areaRewards'
import { createInitialRpgState } from './state'

describe('registered Area equipment rewards', () => {
  it('every registered reward names actual equipment and is granted from the same metadata', () => {
    for (const area of areas) {
      if (!area.clearRewardEquipmentId) continue
      expect(equipmentById[area.clearRewardEquipmentId]).toBeDefined()
      const next = grantAreaClearEquipment({ clearedAreaIds: [area.id] }, createInitialRpgState(), areas)
      expect(next.ownedEquipmentIds).toContain(area.clearRewardEquipmentId)
    }
  })

  it('a third Area is supported without a JS/TS grant branch; replay is a reference no-op', () => {
    const registry = [{ id: 'database', clearRewardEquipmentId: 'debug-charm' }]
    const initial = createInitialRpgState()
    expect(grantAreaClearEquipment({ clearedAreaIds: [] }, initial, registry)).toBe(initial)
    const progress = { clearedAreaIds: ['database'] }
    const next = grantAreaClearEquipment(progress, initial, registry)
    expect(next.ownedEquipmentIds).toContain('debug-charm')
    expect(initial.ownedEquipmentIds).not.toContain('debug-charm')
    expect(grantAreaClearEquipment(progress, next, registry)).toBe(next)
  })
})

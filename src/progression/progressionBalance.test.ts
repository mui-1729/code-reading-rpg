import { describe, expect, it } from 'vitest'
import { battles } from '../game/battles'
import { getLevelForExp, getTotalExpForLevel } from './progression'
import { JAVASCRIPT_BATTLE_SEQUENCE } from './progressionGraph'

const expRewardByBattleId = new Map(battles.map((battle) => [battle.id, battle.expReward]))

function getRouteExpThrough(stageId: number): number {
  let total = 0
  for (const battleId of JAVASCRIPT_BATTLE_SEQUENCE) {
    total += expRewardByBattleId.get(battleId) ?? 0
    if (battleId === stageId) return total
  }
  throw new Error(`Stage ${stageId} is not in the JavaScript route`)
}

describe('RPG progression balance', () => {
  it('main JavaScript route reaches the intended level bands without mandatory grinding', () => {
    expect(getRouteExpThrough(1)).toBe(12)
    expect(getLevelForExp(getRouteExpThrough(1))).toBe(1)

    expect(getRouteExpThrough(9)).toBe(36)
    expect(getLevelForExp(getRouteExpThrough(9))).toBe(1)

    expect(getRouteExpThrough(10)).toBe(52)
    expect(getLevelForExp(getRouteExpThrough(10))).toBe(2)

    expect(getRouteExpThrough(14)).toBe(160)
    expect(getLevelForExp(getRouteExpThrough(14))).toBe(3)

    expect(getRouteExpThrough(2)).toBe(240)
    expect(getLevelForExp(getRouteExpThrough(2))).toBe(3)

    expect(getRouteExpThrough(18)).toBe(372)
    expect(getLevelForExp(getRouteExpThrough(18))).toBe(4)

    expect(getRouteExpThrough(22)).toBe(540)
    expect(getLevelForExp(getRouteExpThrough(22))).toBe(4)

    expect(getRouteExpThrough(3)).toBe(640)
    expect(getLevelForExp(getRouteExpThrough(3))).toBe(5)
  })

  it('the Final recommended level remains a useful stretch target rather than a hard gate', () => {
    const final = battles.find((battle) => battle.id === 3)
    expect(final?.recommendedLevel).toBe(5)

    const expBeforeFinal = getRouteExpThrough(22)
    expect(getLevelForExp(expBeforeFinal)).toBe(4)
    expect(getTotalExpForLevel(5) - expBeforeFinal).toBe(100)
  })

  it('grinding only JS-01 remains possible but gets rapidly less efficient at higher levels', () => {
    const firstIncident = battles.find((battle) => battle.id === 1)
    expect(firstIncident?.expReward).toBe(12)
    if (!firstIncident) return

    const winsForLevel = (level: number) =>
      Math.ceil(getTotalExpForLevel(level) / firstIncident.expReward)

    expect(winsForLevel(2)).toBe(4)
    expect(winsForLevel(3)).toBe(12)
    expect(winsForLevel(4)).toBe(28)
    expect(winsForLevel(5)).toBe(54)
    expect(winsForLevel(6)).toBe(92)
    expect(winsForLevel(7)).toBe(145)
    expect(winsForLevel(8)).toBe(216)
  })

  it('later Story Battles reward meaningfully more EXP than the opening grind target', () => {
    const firstIncident = battles.find((battle) => battle.id === 1)
    const deepTrace = battles.find((battle) => battle.id === 22)
    const final = battles.find((battle) => battle.id === 3)

    expect(firstIncident?.expReward).toBe(12)
    expect(deepTrace?.expReward).toBe(44)
    expect(final?.expReward).toBe(100)
  })
})

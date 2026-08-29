import type { RpgState } from '../rpg'
import { OVERWORLD_MAP_ID, WORLD_START } from '../world/worldMap'

export function withBattleHp(state: RpgState, currentHp: number): RpgState {
  return { ...state, currentHp }
}

export function createDefeatRecoveryState(state: RpgState, maxHp: number): RpgState {
  return {
    ...state,
    currentHp: maxHp,
    worldMapId: OVERWORLD_MAP_ID,
    worldPosition: { ...WORLD_START },
    stepsSinceEncounter: 8,
  }
}

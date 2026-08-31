import type { RpgState } from '../rpg'

export function withBattleHp(state: RpgState, currentHp: number): RpgState {
  return { ...state, currentHp }
}

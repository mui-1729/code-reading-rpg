import { battles, generateBattle, type Battle, type Seed } from '../game'

export type BattleReturnPath = '/world' | '/javascript/field' | '/typescript/field'

export type BattleSession = {
  battleId: number
  seed: Seed
  returnTo?: BattleReturnPath
  battle: Battle
  nextBattle?: Battle
}

export function createBattleSession(
  battleId: number,
  seed: Seed,
  returnTo?: BattleReturnPath,
): BattleSession {
  const battle = generateBattle(battleId, seed)
  if (!battle) throw new Error(`Unknown battle: ${battleId}`)

  const battleIndex = battles.findIndex((candidate) => candidate.id === battleId)
  const nextBattleCandidate = battles[battleIndex + 1]
  const nextBattle = nextBattleCandidate?.areaId === battle.areaId ? nextBattleCandidate : undefined

  return {
    battleId,
    seed,
    returnTo,
    battle,
    nextBattle,
  }
}

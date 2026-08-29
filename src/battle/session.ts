import { battles, generateBattle, type Battle, type Seed } from '../game'
import { getNextBattleId, type ProgressionArea } from '../progression'

export type BattleReturnPath = '/world' | '/javascript/field' | '/typescript/field'

export type BattleSession = {
  battleId: number
  seed: Seed
  returnTo?: BattleReturnPath
  battle: Battle
  nextBattle?: Battle
}

function isProgressionArea(areaId: string): areaId is ProgressionArea {
  return areaId === 'javascript' || areaId === 'typescript'
}

export function createBattleSession(
  battleId: number,
  seed: Seed,
  returnTo?: BattleReturnPath,
): BattleSession {
  const battle = generateBattle(battleId, seed)
  if (!battle) throw new Error(`Unknown battle: ${battleId}`)

  const nextBattleId = isProgressionArea(battle.areaId)
    ? getNextBattleId(battle.areaId, battleId)
    : undefined
  const nextBattle = nextBattleId === undefined
    ? undefined
    : battles.find((candidate) => candidate.id === nextBattleId)

  return {
    battleId,
    seed,
    returnTo,
    battle,
    nextBattle,
  }
}

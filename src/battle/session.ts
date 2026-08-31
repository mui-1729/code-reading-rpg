import { battles, generateBattle, type Battle, type Seed } from '../game'
import { areas, getAreaDefinition, type AreaRoutePath } from '../game/areas'

export type BattleReturnPath = '/world' | AreaRoutePath

export function validateBattleSearch(search: Record<string, unknown>) {
  return {
    seed: typeof search.seed === 'string' && search.seed.length > 0 ? search.seed : undefined,
    returnTo: search.returnTo === '/world'
      ? '/world' as const
      : areas.some((area) => area.routes.field === search.returnTo)
        ? search.returnTo as AreaRoutePath
        : undefined,
  }
}

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

  const sequence = getAreaDefinition(battle.areaId)?.battleIds ?? []
  const currentIndex = sequence.indexOf(battleId)
  const nextBattleId = currentIndex >= 0 ? sequence[currentIndex + 1] : undefined
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

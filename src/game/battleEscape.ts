export type BattleEscapeContext = {
  battleId: number
  seed: string | null
  returnTo: string | null
  clearedStageIds: readonly number[]
}

export function isBattleEscapeAllowed({
  battleId,
  seed,
  returnTo,
  clearedStageIds,
}: BattleEscapeContext): boolean {
  if (returnTo !== '/world' || !seed) return false
  if (seed.startsWith('boss:') || seed.startsWith('midboss:') || seed.startsWith('village-training:')) {
    return false
  }
  if (!seed.startsWith('encounter:')) return false

  const [, encounterScope] = seed.split(':')
  if (/^\d+$/.test(encounterScope ?? '')) return true

  return clearedStageIds.includes(battleId)
}

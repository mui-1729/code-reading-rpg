export const BATTLE_MOTION = {
  skillWindupMs: 140,
  semanticFeedbackMs: 420,
  hitMs: 360,
  defeatMs: 420,
  enemyWindupMs: 180,
  enemyImpactDelayMs: 100,
  // Keep each attacker highlighted through its complete hit reaction. The next
  // attacker starts exactly when that reaction ends, so there is no blank gap
  // where ENEMY TURN is active but no source is visually identifiable.
  enemyAttackStepMs: 520,
  playerHitMs: 420,
  resultDelayMs: 180,
} as const

type HpEntity = {
  id: string
  hp: number
}

export function getNewlyDefeatedIds(before: HpEntity[], after: HpEntity[]): string[] {
  const previousHp = new Map(before.map((entity) => [entity.id, entity.hp]))

  return after
    .filter((entity) => entity.hp <= 0 && (previousHp.get(entity.id) ?? 0) > 0)
    .map((entity) => entity.id)
}

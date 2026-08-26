export const BATTLE_MOTION = {
  skillWindupMs: 140,
  hitMs: 360,
  defeatMs: 420,
  enemyWindupMs: 320,
  playerHitMs: 360,
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

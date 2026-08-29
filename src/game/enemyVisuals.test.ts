import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import { ENEMY_VISUAL_FALLBACK_ID, getEnemyVisualId } from './enemyVisuals'

describe('Enemy visual invariant', () => {
  it('全registered Enemy nameに固有visual IDがある', () => {
    const names = Array.from(
      new Set(battles.flatMap((battle) => battle.enemies.map((enemy) => enemy.name))),
    )

    for (const name of names) {
      expect(getEnemyVisualId(name), `${name} must not use the fallback`).not.toBe(
        ENEMY_VISUAL_FALLBACK_ID,
      )
    }
  })

  it('未知のEnemyも透明にならずfallback visualを使う', () => {
    expect(getEnemyVisualId('Future Enemy')).toBe(ENEMY_VISUAL_FALLBACK_ID)
  })
})

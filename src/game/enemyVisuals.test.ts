import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import { ENEMY_VISUAL_FALLBACK_ID, getEnemyVisualId } from './enemyVisuals'

describe('Enemy visual invariant', () => {
  it('全registered Enemyが表示名に依存しないrole/visual IDを持つ', () => {
    for (const enemy of battles.flatMap((battle) => battle.enemies)) {
      expect(getEnemyVisualId(enemy), `${enemy.id} must not use the fallback`).not.toBe(
        ENEMY_VISUAL_FALLBACK_ID,
      )
      expect(['standard', 'elite', 'boss']).toContain(enemy.role)
      const renamedEnemy = { ...enemy, name: '翻訳された名前' }
      expect(getEnemyVisualId(renamedEnemy)).toBe(getEnemyVisualId(enemy))
    }
  })

  it('未知のEnemyも透明にならずfallback visualを使う', () => {
    expect(getEnemyVisualId({ visualId: 'future-enemy' })).toBe(ENEMY_VISUAL_FALLBACK_ID)
  })
})

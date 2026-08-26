import { useEffect, useMemo } from 'react'
import type { Enemy, SkillCard } from '../game/types'
import { createEnemyInspectionSnapshot } from './enemyInspection'

type EnemyDataInspectorProps = {
  enemy: Enemy
  selectedSkill: SkillCard | null
  onClose: () => void
}

const formatValue = (value: string | number | boolean | null) => {
  if (typeof value === 'string') return JSON.stringify(value)
  if (value === null) return 'null'
  return String(value)
}

export function EnemyDataInspector({
  enemy,
  selectedSkill,
  onClose,
}: EnemyDataInspectorProps) {
  const snapshot = useMemo(
    () => createEnemyInspectionSnapshot(enemy, selectedSkill),
    [enemy, selectedSkill],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <aside className="enemy-data-inspector pixel-window" role="dialog" aria-label={`${enemy.name} data inspector`}>
      <header className="enemy-data-inspector-head">
        <div>
          <span className="eyebrow">DATA INSPECTOR</span>
          <h2>{enemy.name}</h2>
        </div>
        <button type="button" className="close-button" onClick={onClose} aria-label="データ確認を閉じる">
          ×
        </button>
      </header>

      <section className="enemy-data-section">
        <div className="enemy-data-section-title">BASE DATA</div>
        <dl className="enemy-data-list">
          {snapshot.base.map((item) => (
            <div className="enemy-data-row" key={item.key}>
              <dt>{item.key}</dt>
              <dd>{formatValue(item.value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="enemy-data-section">
        <div className="enemy-data-section-title">CODE VALUES</div>
        {selectedSkill ? (
          <div className="enemy-data-code-context">
            <span>{selectedSkill.name}</span>
            <code>{selectedSkill.codeVariantId ?? 'default'}</code>
          </div>
        ) : (
          <p className="enemy-data-empty">SkillをSELECTすると中間値を確認できます。</p>
        )}

        {selectedSkill && snapshot.derived.length === 0 && (
          <p className="enemy-data-empty">このcodeではEnemy単体の追加中間値はありません。</p>
        )}

        {snapshot.derived.length > 0 && (
          <dl className="enemy-data-list enemy-derived-list">
            {snapshot.derived.map((item) => (
              <div className="enemy-data-row enemy-derived-row" key={`${item.key}:${item.expression}`}>
                <dt>{item.key}</dt>
                <dd>{formatValue(item.value)}</dd>
                <code>{item.key} = {item.expression}</code>
              </div>
            ))}
          </dl>
        )}
      </section>
    </aside>
  )
}

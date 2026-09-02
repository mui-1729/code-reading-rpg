import { useModalFocus } from '../ui/useModalFocus'
import {
  createCodeDataVariables,
  createEnemyInspectionSnapshot,
  type CodeDataValue,
  type RuntimeEnemy,
} from './enemyInspection'

type CodeDataCollection = readonly Record<string, string | number | boolean | null>[]

type BattleCodeDataProps = {
  enemies: readonly RuntimeEnemy[]
  selectedCode: string | null
  selectedSkillName: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedEnemyKey: string | null
  actionLocked: boolean
}

function formatScalar(value: string | number | boolean | null) {
  if (typeof value === 'string') return JSON.stringify(value)
  if (value === null) return 'null'
  return String(value)
}

function isCollection(value: CodeDataValue): value is CodeDataCollection {
  return Array.isArray(value)
}

function DataValue({ value }: { value: CodeDataValue }) {
  if (!isCollection(value)) return <strong>{formatScalar(value)}</strong>

  return (
    <div className="code-data-collection">
      {value.length === 0 ? (
        <span>[]</span>
      ) : (
        value.map((item, index) => (
          <code key={`${index}:${JSON.stringify(item)}`}>{JSON.stringify(item)}</code>
        ))
      )}
    </div>
  )
}

export function BattleCodeData({
  enemies,
  selectedCode,
  selectedSkillName,
  open,
  onOpenChange: setOpen,
  selectedEnemyKey,
  actionLocked,
}: BattleCodeDataProps) {
  const selectedEnemy = selectedEnemyKey
    ? enemies.find((enemy) => enemy.key === selectedEnemyKey) ?? null
    : null
  const codeVariables = createCodeDataVariables(enemies, selectedCode)
  const enemySnapshot = selectedEnemy
    ? createEnemyInspectionSnapshot(selectedEnemy, selectedCode)
    : null
  const dialogRef = useModalFocus<HTMLElement>({
    open,
    onEscape: () => setOpen(false),
  })

  return (
    <>
      <button
        type="button"
        className="floating-code-data"
        onClick={() => setOpen(!open)}
        aria-label="コードで使う実データを確認"
        aria-expanded={open}
        disabled={actionLocked}
      >
        DATA
      </button>

      {open && (
        <div className="code-data-modal-layer" role="presentation" onClick={() => setOpen(false)}>
        <aside
          ref={dialogRef}
          className="code-data-panel pixel-window"
          role="dialog"
          aria-modal="true"
          aria-label="Code data"
          tabIndex={-1}
          onClick={(event) => event.stopPropagation()}
        >
          <header className="code-data-head">
            <div>
              <span className="eyebrow">CODE DATA</span>
              <h2>{selectedSkillName ?? 'RUNTIME VALUES'}</h2>
            </div>
            <button
              type="button"
              className="close-button"
              onClick={() => setOpen(false)}
              aria-label="コードデータを閉じる"
            >
              ×
            </button>
          </header>

          <p className="code-data-note">
            displayed codeの <code>enemies</code> は現在生存中（HP &gt; 0）のEnemy配列です。
            <code> attackDamage</code> はraw値、<code>incomingDamage</code> はPlayer DEF適用後のNEXT damageです。
          </p>

          {!selectedCode && (
            <p className="code-data-note">SkillをSELECTすると、そのcode内で作られる途中の値も表示されます。</p>
          )}

          <section className="code-data-section">
            <div className="code-data-section-title">RUNTIME CONTEXT</div>
            <div className="code-data-variables">
              {codeVariables.map((variable) => (
                <div className="code-data-variable" key={variable.name}>
                  <div className="code-data-variable-head">
                    <code>{variable.name}</code>
                    {!isCollection(variable.value) && <DataValue value={variable.value} />}
                  </div>
                  {variable.expression && <small>{variable.expression}</small>}
                  {isCollection(variable.value) && <DataValue value={variable.value} />}
                </div>
              ))}
            </div>
          </section>

          <section className="code-data-section">
            <div className="code-data-section-title">ENEMY OBJECT</div>
            {selectedEnemy && enemySnapshot ? (
              <>
                <div className="code-data-selected-enemy">{selectedEnemy.name}</div>
                <dl className="enemy-data-list">
                  {enemySnapshot.base.map((item) => (
                    <div className="enemy-data-row" key={item.name}>
                      <dt>{item.name}</dt>
                      <dd><DataValue value={item.value} /></dd>
                    </div>
                  ))}
                </dl>
                {enemySnapshot.derived.length > 0 && (
                  <div className="code-data-derived">
                    <div className="code-data-section-title">VALUES FOR THIS ENEMY</div>
                    {enemySnapshot.derived.map((item) => (
                      <div className="code-data-variable" key={item.name}>
                        <div className="code-data-variable-head">
                          <code>{item.name}</code>
                          <DataValue value={item.value} />
                        </div>
                        {item.expression && <small>{item.name} = {item.expression}</small>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="code-data-note">Enemyをクリック / タップすると、そのobjectの実データを確認できます。</p>
            )}
          </section>
        </aside>
        </div>
      )}
    </>
  )
}

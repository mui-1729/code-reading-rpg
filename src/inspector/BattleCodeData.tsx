import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createCodeDataVariables,
  createEnemyInspectionSnapshot,
  type CodeDataValue,
  type RuntimeEnemy,
} from './enemyInspection'

const BATTLE_PATH_PATTERN = /^\/(javascript|typescript)\/battle\/[^/]+$/

function isBattleRoute() {
  return BATTLE_PATH_PATTERN.test(window.location.pathname)
}

function parseNumber(value: string | null | undefined) {
  if (!value) return null
  const match = value.match(/-?\d+/)
  return match ? Number(match[0]) : null
}

function readSelectedCode() {
  return document.querySelector('.skill-card.selected code')?.textContent?.trim() ?? null
}

function readSelectedSkillName() {
  return document.querySelector('.skill-card.selected .skill-card-head span')?.textContent?.trim() ?? null
}

function readEnemies(cache: Map<string, RuntimeEnemy>): RuntimeEnemy[] {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('.enemy-card'))

  return cards.flatMap((card, index) => {
    const name = card.querySelector('.enemy-name-row h2')?.textContent?.trim()
    const hpText = card.querySelector('.enemy-name-row span')?.textContent?.trim()
    if (!name || !hpText) return []

    const [hpRaw, maxHpRaw] = hpText.split('/')
    const hp = Number(hpRaw)
    const maxHp = Number(maxHpRaw)
    if (!Number.isFinite(hp) || !Number.isFinite(maxHp)) return []

    const key = `${index}:${name}`
    const previous = cache.get(key)
    const attackNameText = card.querySelector('.intent-box strong')?.textContent?.trim() ?? ''
    const attackDamageText = card.querySelector('.intent-box em')?.textContent?.trim() ?? ''
    const parsedAttackDamage = parseNumber(attackDamageText)

    const enemy: RuntimeEnemy = {
      key,
      name,
      hp,
      maxHp,
      attackName: attackNameText === '—' ? previous?.attackName ?? '—' : attackNameText,
      attackDamage: parsedAttackDamage ?? previous?.attackDamage ?? 0,
    }

    cache.set(key, enemy)
    return [enemy]
  })
}

function formatScalar(value: string | number | boolean | null) {
  if (typeof value === 'string') return JSON.stringify(value)
  if (value === null) return 'null'
  return String(value)
}

function DataValue({ value }: { value: CodeDataValue }) {
  if (!Array.isArray(value)) return <strong>{formatScalar(value)}</strong>

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

export function BattleCodeData() {
  const [, setRevision] = useState(0)
  const [open, setOpen] = useState(false)
  const [selectedEnemyKey, setSelectedEnemyKey] = useState<string | null>(null)
  const enemyCacheRef = useRef(new Map<string, RuntimeEnemy>())
  const battleRoute = typeof window !== 'undefined' && isBattleRoute()
  const enemies = battleRoute ? readEnemies(enemyCacheRef.current) : []
  const selectedCode = battleRoute ? readSelectedCode() : null
  const selectedSkillName = battleRoute ? readSelectedSkillName() : null
  const selectedEnemy = selectedEnemyKey
    ? enemies.find((enemy) => enemy.key === selectedEnemyKey) ?? null
    : null

  const codeVariables = useMemo(
    () => createCodeDataVariables(enemies, selectedCode),
    [enemies, selectedCode],
  )
  const enemySnapshot = useMemo(
    () => selectedEnemy ? createEnemyInspectionSnapshot(selectedEnemy, selectedCode) : null,
    [selectedCode, selectedEnemy],
  )

  useEffect(() => {
    let frame = 0
    const observer = new MutationObserver(() => {
      if (frame !== 0) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        setRevision((current) => current + 1)
      })
    })

    observer.observe(document.body, { childList: true, characterData: true, subtree: true })
    return () => {
      observer.disconnect()
      if (frame !== 0) window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    if (!battleRoute) {
      setOpen(false)
      setSelectedEnemyKey(null)
      enemyCacheRef.current.clear()
      return
    }

    const cards = Array.from(document.querySelectorAll<HTMLElement>('.enemy-card'))
    cards.forEach((card, index) => {
      const name = card.querySelector('.enemy-name-row h2')?.textContent?.trim() ?? `Enemy ${index + 1}`
      card.classList.add('code-data-clickable')
      card.setAttribute('role', 'button')
      card.setAttribute('tabindex', '0')
      card.setAttribute('aria-label', `${name}のコード上のデータを確認`)
    })

    return () => {
      cards.forEach((card) => {
        card.classList.remove('code-data-clickable', 'code-data-inspected')
        card.removeAttribute('role')
        card.removeAttribute('tabindex')
        card.removeAttribute('aria-label')
      })
    }
  }, [battleRoute, enemies.length])

  useEffect(() => {
    const openEnemy = (card: Element) => {
      const cards = Array.from(document.querySelectorAll<HTMLElement>('.enemy-card'))
      const index = cards.indexOf(card as HTMLElement)
      if (index < 0) return
      const name = card.querySelector('.enemy-name-row h2')?.textContent?.trim()
      if (!name) return
      setSelectedEnemyKey(`${index}:${name}`)
      setOpen(true)
    }

    const onClick = (event: MouseEvent) => {
      if (!battleRoute || document.querySelector('.result-overlay, .modal-overlay')) return
      const target = event.target
      if (!(target instanceof Element)) return
      const card = target.closest('.enemy-card')
      if (card) openEnemy(card)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false)
        return
      }
      if (!battleRoute || (event.key !== 'Enter' && event.key !== ' ')) return
      const target = event.target
      if (!(target instanceof Element)) return
      const card = target.closest('.enemy-card')
      if (!card) return
      event.preventDefault()
      openEnemy(card)
    }

    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [battleRoute, open])

  useEffect(() => {
    document.querySelectorAll('.enemy-card').forEach((card) => {
      card.classList.remove('code-data-inspected')
    })
    if (!selectedEnemyKey) return

    const cards = Array.from(document.querySelectorAll<HTMLElement>('.enemy-card'))
    const selected = enemies.find((enemy) => enemy.key === selectedEnemyKey)
    if (!selected) return
    const index = enemies.indexOf(selected)
    cards[index]?.classList.add('code-data-inspected')
  }, [enemies, selectedEnemyKey])

  if (!battleRoute || document.querySelector('.result-overlay')) return null

  return (
    <>
      <button
        type="button"
        className="floating-code-data"
        onClick={() => setOpen((current) => !current)}
        aria-label="コードで使う実データを確認"
        aria-expanded={open}
      >
        DATA
      </button>

      {open && (
        <aside className="code-data-panel pixel-window" role="dialog" aria-label="Code data">
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
                    {!Array.isArray(variable.value) && <DataValue value={variable.value} />}
                  </div>
                  {variable.expression && <small>{variable.expression}</small>}
                  {Array.isArray(variable.value) && <DataValue value={variable.value} />}
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
      )}
    </>
  )
}

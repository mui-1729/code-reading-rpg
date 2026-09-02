import { useEffect, useState } from 'react'
import { useReducedMotion } from '../motion/useReducedMotion'
import { getEquipmentPresentation } from '../rpg'
import type { ResultSequenceItem } from './resultSequence'

const AUTO_ADVANCE_MS = 1100

type BattleResultSequenceProps = {
  items: readonly ResultSequenceItem[]
  paused: boolean
  done: boolean
  onComplete: () => void
}

/** Reward data comes from the victory transaction, never from rendered text. */
export function BattleResultSequence({ items, paused, done, onComplete }: BattleResultSequenceProps) {
  const [index, setIndex] = useState(0)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (done || paused || reducedMotion || items.length === 0) return
    const timer = window.setTimeout(() => {
      if (index >= items.length - 1) onComplete()
      else setIndex((current) => current + 1)
    }, AUTO_ADVANCE_MS)
    return () => window.clearTimeout(timer)
  }, [done, index, items.length, onComplete, paused, reducedMotion])

  if (items.length === 0) return null
  const current = items[Math.min(index, items.length - 1)]
  const currentEquipment = current.equipmentId ? getEquipmentPresentation(current.equipmentId) : null
  const advance = () => {
    if (done || paused) return
    if (index >= items.length - 1) onComplete()
    else setIndex((currentIndex) => currentIndex + 1)
  }

  return (
    <div className={`result-sequence-panel ${done ? 'is-summary' : `tone-${current.tone}`}`} aria-live="polite">
      {done ? (
        <>
          <div className="result-sequence-kicker">RESULT</div>
          <div className="result-sequence-summary">
            {items.map((item) => {
              const equipment = item.equipmentId ? getEquipmentPresentation(item.equipmentId) : null
              return (
                <div key={item.id} className={item.equipmentId ? 'is-equipment' : undefined}>
                  {equipment?.visual && <img className="result-equipment-icon equipment-pixel-icon" src={equipment.visual} alt="" aria-hidden="true" />}
                  <span>{item.title}</span>
                  {item.detail && <strong>{item.detail}</strong>}
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="result-sequence-event" key={`${current.id}:${index}`} onClick={advance}>
          <div className="result-sequence-kicker">{index + 1} / {items.length}</div>
          {currentEquipment?.visual && <img className="result-equipment-hero equipment-pixel-icon" src={currentEquipment.visual} alt="" aria-hidden="true" />}
          <strong>{current.title}</strong>
          {current.detail && <span>{current.detail}</span>}
          <small>{reducedMotion ? 'Manual advance · NEXT / SKIP' : 'Tap / click to continue'}</small>
        </div>
      )}
      {!done && (
        <div className="result-sequence-controls">
          <button type="button" className="primary-button" onClick={advance} disabled={paused}>NEXT</button>
          <button type="button" className="secondary-button" onClick={onComplete} disabled={paused}>SKIP</button>
        </div>
      )}
    </div>
  )
}

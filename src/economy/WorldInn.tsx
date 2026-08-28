import { useEffect } from 'react'
import { gameAudio } from '../audio/gameAudio'
import { useProgress } from '../progression'
import { getCombatStats, useRpg } from '../rpg'
import { getInnRestQuote, resolveInnRest } from './inn'

type WorldInnProps = {
  open: boolean
  onClose: () => void
  onMessage: (message: string) => void
}

export function WorldInn({ open, onClose, onMessage }: WorldInnProps) {
  const { progress, stats, setProgress } = useProgress()
  const { rpgState, setRpgState } = useRpg()
  const combatStats = getCombatStats(stats, rpgState)
  const quote = getInnRestQuote(progress, rpgState, combatStats.maxHp)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) return null

  const rest = () => {
    const result = resolveInnRest(progress, rpgState, combatStats.maxHp)
    if (!result.rested) {
      gameAudio.playSe('cancel')
      onMessage(
        result.reason === 'full-hp'
          ? 'INN: HPはすでに満タン。Goldは消費しない。'
          : `INN: Goldが足りない。あと ${result.quote.shortage} G必要。`,
      )
      return
    }

    setProgress(result.progress)
    setRpgState(result.rpgState)
    gameAudio.playSe('levelUp')
    onMessage(
      `INN: -${result.quote.price} G · HP ${result.quote.maxHp} / ${result.quote.maxHp} · FULL RECOVERY`,
    )
    onClose()
  }

  const actionLabel =
    quote.reason === 'full-hp'
      ? 'HP FULL'
      : quote.reason === 'insufficient-gold'
        ? `SHORT ${quote.shortage} G`
        : '▶ REST'

  return (
    <div className="overlay inn-overlay" onClick={onClose}>
      <section
        className="inn-panel pixel-window"
        role="dialog"
        aria-modal="true"
        aria-label="Inn / Rest"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="close-button" onClick={onClose} aria-label="Innを閉じる">
          ×
        </button>
        <div className="eyebrow">CENTRAL HUB // SAFE HOUSE</div>
        <h2>INN / REST</h2>
        <p className="inn-description">Hubへ戻る代わりに、PATCH KITより安く全回復できる。</p>

        <div className="inn-hp-card pixel-inner-window">
          <span>
            <small>CURRENT HP</small>
            <strong>{quote.currentHp} / {quote.maxHp}</strong>
          </span>
          <span>
            <small>RECOVER</small>
            <strong>{quote.healAmount > 0 ? `+${quote.healAmount} HP` : 'FULL'}</strong>
          </span>
        </div>

        <div className="inn-cost-card pixel-inner-window" data-rest-state={quote.reason}>
          <span>
            <small>PRICE</small>
            <strong>{quote.price} G</strong>
          </span>
          <span>
            <small>GOLD</small>
            <strong>
              {quote.wallet} G → {quote.afterRestGold === null ? '—' : `${quote.afterRestGold} G`}
            </strong>
          </span>
          {quote.shortage > 0 && <em>SHORT {quote.shortage} G</em>}
          {quote.reason === 'full-hp' && <em className="is-safe">NO CHARGE · HP FULL</em>}
        </div>

        <div className="inn-actions">
          <button
            type="button"
            className="primary-button"
            onClick={rest}
            disabled={!quote.canRest}
          >
            {actionLabel}
          </button>
          <button type="button" className="secondary-button" onClick={onClose}>
            CANCEL
          </button>
        </div>
      </section>
    </div>
  )
}

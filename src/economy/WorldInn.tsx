import { gameAudio } from '../audio/gameAudio'
import { useProgress } from '../progression'
import { getCombatStats, useRpg } from '../rpg'
import { useModalFocus } from '../ui/useModalFocus'
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

  const dialogRef = useModalFocus<HTMLElement>({ open, onEscape: onClose })

  if (!open) return null

  const rest = () => {
    const result = resolveInnRest(progress, rpgState, combatStats.maxHp)
    if (!result.rested) {
      gameAudio.playSe('cancel')
      onMessage(
        result.reason === 'full-hp'
          ? '宿: HPはすでに満タン。ゴールドは消費しない。'
          : `宿: ゴールドが足りない。あと ${result.quote.shortage} G必要。`,
      )
      return
    }

    setProgress(result.progress)
    setRpgState(result.rpgState)
    gameAudio.playSe('levelUp')
    onMessage(
      `宿: -${result.quote.price} G · HP ${result.quote.maxHp} / ${result.quote.maxHp} · 全回復`,
    )
    onClose()
  }

  const actionLabel =
    quote.reason === 'full-hp'
      ? 'HP満タン'
      : quote.reason === 'insufficient-gold'
        ? `あと ${quote.shortage} G必要`
        : '▶ 休む'

  return (
    <div className="overlay inn-overlay" onClick={onClose}>
      <section
        ref={dialogRef}
        className="inn-panel pixel-window"
        role="dialog"
        aria-modal="true"
        aria-label="宿"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="close-button" onClick={onClose} aria-label="宿を閉じる">
          ×
        </button>
        <div className="eyebrow">中央ハブ // 休息所</div>
        <h2>宿</h2>
        <p className="inn-description">ここで休むと、PATCH KITより安くHPを全回復できる。</p>

        <div className="inn-hp-card pixel-inner-window">
          <span>
            <small>現在のHP</small>
            <strong>{quote.currentHp} / {quote.maxHp}</strong>
          </span>
          <span>
            <small>回復量</small>
            <strong>{quote.healAmount > 0 ? `+${quote.healAmount} HP` : '満タン'}</strong>
          </span>
        </div>

        <div className="inn-cost-card pixel-inner-window" data-rest-state={quote.reason}>
          <span>
            <small>料金</small>
            <strong>{quote.price} G</strong>
          </span>
          <span>
            <small>所持金</small>
            <strong>
              {quote.wallet} G → {quote.afterRestGold === null ? '—' : `${quote.afterRestGold} G`}
            </strong>
          </span>
          {quote.shortage > 0 && <em>あと {quote.shortage} G必要</em>}
          {quote.reason === 'full-hp' && <em className="is-safe">料金不要 · HP満タン</em>}
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
            キャンセル
          </button>
        </div>
      </section>
    </div>
  )
}

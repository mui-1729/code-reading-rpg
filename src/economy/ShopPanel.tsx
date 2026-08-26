import { gameAudio } from '../audio/gameAudio'
import { useProgress } from '../progression'
import { PATCH_KIT_COST, PATCH_KIT_HEAL, purchasePatchKit } from './economy'

type ShopPanelProps = {
  onClose: () => void
}

export function ShopPanel({ onClose }: ShopPanelProps) {
  const { progress, setProgress } = useProgress()
  const canBuyPatchKit = progress.gold >= PATCH_KIT_COST

  const buyPatchKit = () => {
    const result = purchasePatchKit(progress)
    if (!result.purchased) {
      gameAudio.playSe('cancel')
      return
    }

    gameAudio.playSe('confirm')
    setProgress(result.progress)
  }

  const close = () => {
    gameAudio.playSe('cancel')
    onClose()
  }

  return (
    <div className="overlay shop-overlay" onClick={close}>
      <section
        className="shop-panel pixel-window"
        role="dialog"
        aria-modal="true"
        aria-label="Shop"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="shop-header">
          <div>
            <div className="eyebrow">SHOP</div>
            <h2>PATCH DEPOT</h2>
          </div>
          <button type="button" className="close-button" aria-label="Close shop" onClick={close}>
            ×
          </button>
        </header>

        <div className="shop-wallet pixel-inner-window">
          <strong>{progress.gold} G</strong>
          <span>PATCH ×{progress.inventory.patchKit}</span>
        </div>

        <article className="shop-item pixel-inner-window">
          <div className="shop-item-name">
            <strong>PATCH KIT</strong>
            <span>HEAL +{PATCH_KIT_HEAL}</span>
          </div>
          <strong className="shop-price">{PATCH_KIT_COST} G</strong>
          <button
            type="button"
            className="primary-button shop-buy"
            disabled={!canBuyPatchKit}
            onClick={buyPatchKit}
          >
            BUY
          </button>
        </article>
      </section>
    </div>
  )
}

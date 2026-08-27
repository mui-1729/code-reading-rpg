import { useEffect } from 'react'
import { gameAudio } from '../audio/gameAudio'
import { useProgress } from '../progression'
import {
  equipmentById,
  getEquipmentPresentation,
  useRpg,
} from '../rpg'
import { PATCH_KIT_HEAL } from './economy'
import { purchaseShopItem, worldShopItems } from './shop'

type WorldShopProps = {
  open: boolean
  onClose: () => void
  onMessage: (message: string) => void
}

export function WorldShop({ open, onClose, onMessage }: WorldShopProps) {
  const { progress, setProgress } = useProgress()
  const { rpgState, setRpgState } = useRpg()

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

  const buy = (itemId: string) => {
    const item = worldShopItems.find((entry) => entry.id === itemId)
    if (!item) return

    const result = purchaseShopItem(progress, rpgState, itemId)
    if (!result.purchased) {
      gameAudio.playSe('cancel')
      onMessage(
        result.reason === 'owned'
          ? 'そのEquipmentはすでに持っている。'
          : result.reason === 'insufficient-gold'
            ? 'Goldが足りない。'
            : 'その商品は購入できない。',
      )
      return
    }

    gameAudio.playSe('confirm')
    setProgress(result.progress)
    setRpgState(result.rpgState)
    const name =
      item.kind === 'consumable'
        ? item.name
        : equipmentById[item.equipmentId]?.name ?? item.equipmentId
    onMessage(`${name}を購入した。残り ${result.progress.gold} G。`)
  }

  return (
    <div className="overlay shop-overlay" onClick={onClose}>
      <section
        className="shop-panel pixel-window world-shop-panel"
        role="dialog"
        aria-modal="true"
        aria-label="World shop"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="close-button" onClick={onClose} aria-label="ショップを閉じる">
          ×
        </button>
        <div className="eyebrow">CENTRAL HUB // SHOP</div>
        <h2>SUPPLY & EQUIPMENT</h2>

        <div className="shop-wallet pixel-inner-window">
          <span>GOLD</span>
          <strong>{progress.gold} G</strong>
        </div>

        <div className="world-shop-list">
          {worldShopItems.map((item) => {
            if (item.kind === 'consumable') {
              const affordable = progress.gold >= item.price
              return (
                <article className="shop-item pixel-inner-window" key={item.id}>
                  <div>
                    <span className="shop-item-name">{item.name}</span>
                    <strong>{item.price} G</strong>
                  </div>
                  <p>HPを最大{PATCH_KIT_HEAL}回復 · 1Battle 1回</p>
                  <div className="shop-stock">OWNED ×{progress.inventory.patchKit}</div>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => buy(item.id)}
                    disabled={!affordable}
                  >
                    {affordable ? '▶ BUY' : 'GOLD SHORTAGE'}
                  </button>
                </article>
              )
            }

            const equipment = equipmentById[item.equipmentId]
            if (!equipment) return null
            const presentation = getEquipmentPresentation(equipment.id, rpgState.equipment)
            if (!presentation) return null

            const equipped = rpgState.equipment[equipment.slot] === equipment.id
            const owned = rpgState.ownedEquipmentIds.includes(equipment.id)
            const affordable = progress.gold >= item.price
            const state = equipped
              ? 'equipped'
              : owned
                ? 'owned'
                : affordable
                  ? 'available'
                  : 'unavailable'

            return (
              <article
                className={`shop-item equipment-shop-item pixel-inner-window is-${state}`}
                key={item.id}
                data-equipment-id={equipment.id}
                data-equipment-state={state}
              >
                <div className="equipment-shop-head">
                  <span className="shop-item-name shop-item-name-with-icon">
                    {presentation.visual && (
                      <img
                        className="equipment-pixel-icon equipment-shop-icon"
                        src={presentation.visual}
                        alt=""
                        aria-hidden="true"
                      />
                    )}
                    <span className="equipment-shop-title">
                      <small>{equipment.slot.toUpperCase()}</small>
                      <strong>{equipment.name}</strong>
                    </span>
                  </span>
                  <strong>{item.price} G</strong>
                </div>
                <p>{equipment.description}</p>
                <div className="equipment-stat-line">{presentation.statSummary}</div>
                <div className="equipment-compare-row">
                  <span>CURRENT · {presentation.currentEquipmentName}</span>
                  <strong>{presentation.deltaSummary}</strong>
                </div>
                <div className={`equipment-state-badge is-${state}`}>
                  {state.toUpperCase()}
                </div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => buy(item.id)}
                  disabled={owned || !affordable}
                >
                  {equipped
                    ? 'EQUIPPED'
                    : owned
                      ? 'OWNED'
                      : affordable
                        ? '▶ BUY'
                        : 'GOLD SHORTAGE'}
                </button>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

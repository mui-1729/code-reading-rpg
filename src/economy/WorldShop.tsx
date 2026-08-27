import { useEffect } from 'react'
import { gameAudio } from '../audio/gameAudio'
import { useProgress } from '../progression'
import { equipmentById, getWeaponVisual, useRpg } from '../rpg'
import { PATCH_KIT_HEAL } from './economy'
import { purchaseShopItem, worldShopItems } from './shop'

type WorldShopProps = {
  open: boolean
  onClose: () => void
  onMessage: (message: string) => void
}

function equipmentStats(equipmentId: string) {
  const item = equipmentById[equipmentId]
  if (!item) return ''
  return [
    item.bonuses.attack ? `ATK +${item.bonuses.attack}` : null,
    item.bonuses.defense ? `DEF +${item.bonuses.defense}` : null,
    item.bonuses.maxHp ? `HP +${item.bonuses.maxHp}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
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
            const owned = rpgState.ownedEquipmentIds.includes(equipment.id)
            const affordable = progress.gold >= item.price
            const visual = getWeaponVisual(equipment.id)
            return (
              <article className="shop-item pixel-inner-window" key={item.id}>
                <div>
                  <span className="shop-item-name shop-item-name-with-icon">
                    {visual && <img className="equipment-pixel-icon" src={visual} alt="" aria-hidden="true" />}
                    {equipment.name}
                  </span>
                  <strong>{item.price} G</strong>
                </div>
                <p>{equipment.description}</p>
                <div className="shop-stock">{equipment.slot.toUpperCase()} · {equipmentStats(equipment.id)}</div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => buy(item.id)}
                  disabled={owned || !affordable}
                >
                  {owned ? 'OWNED' : affordable ? '▶ BUY' : 'GOLD SHORTAGE'}
                </button>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

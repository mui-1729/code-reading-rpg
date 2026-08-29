import { gameAudio } from '../audio/gameAudio'
import { useProgress } from '../progression'
import { useModalFocus } from '../ui/useModalFocus'
import {
  equipItem,
  equipmentById,
  getEquipmentPresentation,
  useRpg,
} from '../rpg'
import {
  getItemCount,
  getItemEffectSummary,
  getItemUsageSummary,
  itemById,
} from './items'
import {
  getShopItemQuote,
  purchaseShopItem,
  worldShopItems,
  type ShopItemDefinition,
  type ShopItemQuote,
} from './shop'

type WorldShopProps = {
  open: boolean
  onClose: () => void
  onMessage: (message: string) => void
}

export function WorldShop({ open, onClose, onMessage }: WorldShopProps) {
  const { progress, setProgress } = useProgress()
  const { rpgState, setRpgState } = useRpg()

  const dialogRef = useModalFocus<HTMLElement>({ open, onEscape: onClose })

  if (!open) return null

  const buy = (itemId: string) => {
    const item = worldShopItems.find((entry) => entry.id === itemId)
    if (!item) return

    const quote = getShopItemQuote(progress, rpgState, itemId)
    const result = purchaseShopItem(progress, rpgState, itemId)
    if (!result.purchased) {
      gameAudio.playSe('cancel')
      onMessage(
        result.reason === 'owned'
          ? 'そのEquipmentはすでに持っている。'
          : result.reason === 'insufficient-gold'
            ? `Goldが足りない。あと ${quote?.shortage ?? 0} G必要。`
            : 'その商品は購入できない。',
      )
      return
    }

    gameAudio.playSe('confirm')
    setProgress(result.progress)
    setRpgState(result.rpgState)
    const name =
      item.kind === 'consumable'
        ? itemById[item.itemId]?.name ?? item.itemId
        : equipmentById[item.equipmentId]?.name ?? item.equipmentId
    onMessage(`${name}を購入した。残り ${result.progress.gold} G。`)
  }

  const equipFromShop = (equipmentId: string) => {
    const equipment = equipmentById[equipmentId]
    if (!equipment || !rpgState.ownedEquipmentIds.includes(equipment.id)) {
      gameAudio.playSe('cancel')
      return
    }

    gameAudio.playSe('confirm')
    setRpgState((current) => ({
      ...current,
      equipment: equipItem(current.equipment, equipment.id),
    }))
    onMessage(`${equipment.name}を装備した。`)
  }

  const renderCostPreview = (quote: ShopItemQuote) => (
    <div className="shop-cost-preview" data-affordable={quote.affordable ? 'true' : 'false'}>
      <span>
        <small>WALLET</small>
        <strong>{quote.wallet} G</strong>
      </span>
      <span>
        <small>PRICE</small>
        <strong>{quote.price} G</strong>
      </span>
      <span>
        <small>AFTER</small>
        <strong>{quote.afterPurchaseGold === null ? '—' : `${quote.afterPurchaseGold} G`}</strong>
      </span>
      {quote.shortage > 0 && <em>SHORT {quote.shortage} G</em>}
    </div>
  )

  const renderShopItem = (item: ShopItemDefinition) => {
    const quote = getShopItemQuote(progress, rpgState, item.id)
    if (!quote) return null

    if (item.kind === 'consumable') {
      const definition = itemById[item.itemId]
      if (!definition) return null
      const count = getItemCount(progress, definition.id)

      return (
        <article
          className={`shop-item item-shop-item pixel-inner-window is-${quote.state}`}
          key={item.id}
          data-item-id={definition.id}
          data-item-state={quote.state}
        >
          <div className="item-shop-head">
            <span className="shop-item-name shop-item-name-with-icon">
              <img
                className="item-pixel-icon item-shop-icon"
                src={definition.visual}
                alt=""
                aria-hidden="true"
              />
              <span className="item-shop-title">
                <small>{definition.categoryLabel}</small>
                <strong>{definition.name}</strong>
              </span>
            </span>
            <strong>{quote.price} G</strong>
          </div>
          <p>{definition.description}</p>
          <div className="item-rule-row">
            <strong>{getItemEffectSummary(definition)}</strong>
            <span>{getItemUsageSummary(definition)}</span>
          </div>
          <div className="shop-stock">OWNED ×{count}</div>
          {renderCostPreview(quote)}
          <button
            type="button"
            className="primary-button"
            onClick={() => buy(item.id)}
            disabled={quote.state === 'unavailable'}
          >
            {quote.state === 'available' ? '▶ BUY' : `SHORT ${quote.shortage} G`}
          </button>
        </article>
      )
    }

    const equipment = equipmentById[item.equipmentId]
    if (!equipment) return null
    const presentation = getEquipmentPresentation(equipment.id, rpgState.equipment)
    if (!presentation) return null

    const state = quote.state
    const owned = state === 'owned' || state === 'equipped'

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
          <strong>{quote.price} G</strong>
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
        {renderCostPreview(quote)}
        <button
          type="button"
          className={state === 'owned' ? 'secondary-button' : 'primary-button'}
          onClick={() => {
            if (state === 'owned') {
              equipFromShop(equipment.id)
              return
            }
            buy(item.id)
          }}
          disabled={state === 'equipped' || state === 'unavailable'}
        >
          {state === 'equipped'
            ? 'EQUIPPED'
            : state === 'owned'
              ? '▶ EQUIP NOW'
              : state === 'available'
                ? '▶ BUY'
                : `SHORT ${quote.shortage} G`}
        </button>
        {owned && state !== 'equipped' && (
          <small className="shop-owned-note">OWNED · loadoutは購入時に変更されません</small>
        )}
      </article>
    )
  }

  const consumables = worldShopItems.filter((item) => item.kind === 'consumable')
  const equipment = worldShopItems.filter((item) => item.kind === 'equipment')

  return (
    <div className="overlay shop-overlay" onClick={onClose}>
      <section
        ref={dialogRef}
        className="shop-panel pixel-window world-shop-panel"
        role="dialog"
        aria-modal="true"
        aria-label="World shop"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="close-button" onClick={onClose} aria-label="ショップを閉じる">
          ×
        </button>
        <div className="eyebrow">CENTRAL HUB // SHOP</div>
        <h2>SUPPLY & EQUIPMENT</h2>

        <div className="shop-wallet pixel-inner-window">
          <span>AVAILABLE GOLD</span>
          <strong>{progress.gold} G</strong>
        </div>

        <section className="world-shop-section" aria-label="Consumables">
          <header className="world-shop-section-head">
            <strong>CONSUMABLE</strong>
            <span>Battleで使う消耗品</span>
          </header>
          <div className="world-shop-list is-consumable">
            {consumables.map(renderShopItem)}
          </div>
        </section>

        <section className="world-shop-section" aria-label="Equipment">
          <header className="world-shop-section-head">
            <strong>EQUIPMENT</strong>
            <span>恒久的なbuild choice</span>
          </header>
          <div className="world-shop-list is-equipment">
            {equipment.map(renderShopItem)}
          </div>
        </section>
      </section>
    </div>
  )
}

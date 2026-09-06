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
  locationLabel?: string
}

const equipmentSlotLabels = {
  weapon: '武器',
  armor: '防具',
  accessory: 'アクセサリー',
} as const

const equipmentStateLabels = {
  available: '購入可能',
  unavailable: '購入不可',
  owned: '所持済み',
  equipped: '装備中',
} as const

export function WorldShop({
  open,
  onClose,
  onMessage,
  locationLabel = 'CENTRAL HUB',
}: WorldShopProps) {
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
          ? 'その装備品はすでに持っている。'
          : result.reason === 'insufficient-gold'
            ? `ゴールドが足りない。あと ${quote?.shortage ?? 0} G必要。`
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
        <small>所持金</small>
        <strong>{quote.wallet} G</strong>
      </span>
      <span>
        <small>価格</small>
        <strong>{quote.price} G</strong>
      </span>
      <span>
        <small>購入後</small>
        <strong>{quote.afterPurchaseGold === null ? '—' : `${quote.afterPurchaseGold} G`}</strong>
      </span>
      {quote.shortage > 0 && <em>あと {quote.shortage} G</em>}
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
          <div className="shop-stock">所持 ×{count}</div>
          {renderCostPreview(quote)}
          <button
            type="button"
            className="primary-button"
            onClick={() => buy(item.id)}
            disabled={quote.state === 'unavailable'}
          >
            {quote.state === 'available' ? '▶ 購入' : `あと ${quote.shortage} G`}
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
              <small>{equipmentSlotLabels[equipment.slot]}</small>
              <strong>{equipment.name}</strong>
            </span>
          </span>
          <strong>{quote.price} G</strong>
        </div>
        <p>{equipment.description}</p>
        <div className="equipment-stat-line">{presentation.statSummary}</div>
        <div className="equipment-compare-row">
          <span>現在装備 · {presentation.currentEquipmentName}</span>
          <strong>{presentation.deltaSummary}</strong>
        </div>
        <div className={`equipment-state-badge is-${state}`}>
          {equipmentStateLabels[state]}
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
            ? '装備中'
            : state === 'owned'
              ? '▶ 装備する'
              : state === 'available'
                ? '▶ 購入'
                : `あと ${quote.shortage} G`}
        </button>
        {owned && state !== 'equipped' && (
          <small className="shop-owned-note">所持済み · 購入だけでは現在装備は変わりません</small>
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
        aria-label="ショップ"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="close-button" onClick={onClose} aria-label="ショップを閉じる">
          ×
        </button>
        <div className="eyebrow">{locationLabel} // ショップ</div>
        <h2>アイテム・装備</h2>

        <div className="shop-wallet pixel-inner-window">
          <span>所持ゴールド</span>
          <strong>{progress.gold} G</strong>
        </div>

        <section className="world-shop-section" aria-label="消耗品">
          <header className="world-shop-section-head">
            <strong>消耗品</strong>
            <span>戦闘で使うアイテム</span>
          </header>
          <div className="world-shop-list is-consumable">
            {consumables.map(renderShopItem)}
          </div>
        </section>

        <section className="world-shop-section" aria-label="装備品">
          <header className="world-shop-section-head">
            <strong>装備品</strong>
            <span>能力を継続的に変える装備</span>
          </header>
          <div className="world-shop-list is-equipment">
            {equipment.map(renderShopItem)}
          </div>
        </section>
      </section>
    </div>
  )
}

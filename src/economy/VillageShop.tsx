import { gameAudio } from '../audio/gameAudio'
import { useProgress } from '../progression'
import {
  equipItem,
  equipmentById,
  getEquipmentPresentation,
  useRpg,
} from '../rpg'
import { useModalFocus } from '../ui/useModalFocus'
import { getItemCount, itemById } from './items'
import { getShopItemQuote, purchaseShopItem, worldShopItems } from './shop'

type VillageShopKind = 'items' | 'equipment'

type VillageShopProps = {
  kind: VillageShopKind
  open: boolean
  onClose: () => void
  onMessage: (message: string) => void
}

export function VillageShop({ kind, open, onClose, onMessage }: VillageShopProps) {
  const { progress, setProgress } = useProgress()
  const { rpgState, setRpgState } = useRpg()
  const dialogRef = useModalFocus<HTMLElement>({ open, onEscape: onClose })

  if (!open) return null

  const stock = worldShopItems.filter((item) =>
    kind === 'items' ? item.kind === 'consumable' : item.kind === 'equipment',
  )

  const buy = (shopItemId: string) => {
    const result = purchaseShopItem(progress, rpgState, shopItemId)
    const quote = getShopItemQuote(progress, rpgState, shopItemId)
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
    setProgress(result.progress)
    setRpgState(result.rpgState)
    gameAudio.playSe('confirm')
    onMessage(`購入した。残り ${result.progress.gold} G。`)
  }

  const equip = (equipmentId: string) => {
    setRpgState((current) => ({
      ...current,
      equipment: equipItem(current.equipment, equipmentId),
    }))
    gameAudio.playSe('confirm')
    const name = equipmentById[equipmentId]?.name ?? equipmentId
    onMessage(`${name}を装備した。`)
  }

  return (
    <div className="overlay shop-overlay" onClick={onClose}>
      <section
        ref={dialogRef}
        className="shop-panel pixel-window world-shop-panel"
        role="dialog"
        aria-modal="true"
        aria-label={kind === 'items' ? '道具屋' : '装備屋'}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="close-button"
          onClick={onClose}
          aria-label={`${kind === 'items' ? '道具屋' : '装備屋'}を閉じる`}
        >
          ×
        </button>
        <div className="eyebrow">グリーンフィールド村 // {kind === 'items' ? '道具屋' : '装備屋'}</div>
        <h2>{kind === 'items' ? '道具を補充する' : '装備を整える'}</h2>
        <div className="shop-wallet pixel-inner-window">
          <span>所持ゴールド</span>
          <strong>{progress.gold} G</strong>
        </div>
        <div className="world-shop-list">
          {stock.map((item) => {
            const quote = getShopItemQuote(progress, rpgState, item.id)
            if (!quote) return null

            if (item.kind === 'consumable') {
              const definition = itemById[item.itemId]
              if (!definition) return null
              return (
                <article className="shop-item pixel-inner-window" key={item.id} data-item-id={definition.id}>
                  <header><strong>{definition.name}</strong><span>{quote.price} G</span></header>
                  <p>{definition.description}</p>
                  <small>所持 ×{getItemCount(progress, definition.id)}</small>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => buy(item.id)}
                    disabled={!quote.affordable}
                  >
                    {quote.affordable ? '▶ 購入' : `あと ${quote.shortage} G`}
                  </button>
                </article>
              )
            }

            const definition = equipmentById[item.equipmentId]
            const presentation = getEquipmentPresentation(item.equipmentId, rpgState.equipment)
            if (!definition || !presentation) return null
            const owned = rpgState.ownedEquipmentIds.includes(definition.id)
            const equipped = rpgState.equipment[definition.slot] === definition.id
            return (
              <article className="shop-item pixel-inner-window" key={item.id} data-equipment-id={definition.id}>
                <header><strong>{definition.name}</strong><span>{quote.price} G</span></header>
                <p>{definition.description}</p>
                <small>{presentation.statSummary} · {presentation.deltaSummary}</small>
                <button
                  type="button"
                  className={owned ? 'secondary-button' : 'primary-button'}
                  onClick={() => (owned ? equip(definition.id) : buy(item.id))}
                  disabled={equipped || (!owned && !quote.affordable)}
                >
                  {equipped
                    ? '装備中'
                    : owned
                      ? '▶ 装備する'
                      : quote.affordable
                        ? '▶ 購入'
                        : `あと ${quote.shortage} G`}
                </button>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

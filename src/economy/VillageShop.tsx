import { WorldShop } from './WorldShop'

type VillageShopKind = 'items' | 'equipment'

type VillageShopProps = {
  kind: VillageShopKind
  open: boolean
  onClose: () => void
  onMessage: (message: string) => void
  locationLabel?: string
}

/**
 * Village shops intentionally share the same presentation and purchase flow as
 * the first World Shop. A village only filters the visible stock and changes
 * the location / facility copy; pricing, state badges and item cards stay
 * canonical in WorldShop.
 */
export function VillageShop({
  kind,
  open,
  onClose,
  onMessage,
  locationLabel = 'グリーンフィールド村',
}: VillageShopProps) {
  return (
    <WorldShop
      kind={kind}
      open={open}
      onClose={onClose}
      onMessage={onMessage}
      locationLabel={locationLabel}
    />
  )
}

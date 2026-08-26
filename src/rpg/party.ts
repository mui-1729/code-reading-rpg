import type { EquipmentLoadout } from './equipment'

export type PartyMemberDefinition = {
  id: string
  name: string
  role: string
  maxHp: number
  attack: number
  defense: number
  glyph: string
  equipment: EquipmentLoadout
}

export const partyMembers: readonly PartyMemberDefinition[] = [
  {
    id: 'byte',
    name: 'BYTE',
    role: 'SCOUT',
    maxHp: 72,
    attack: 7,
    defense: 3,
    glyph: 'B',
    equipment: { weapon: null, armor: null, accessory: null },
  },
]

export const partyMemberById: Record<string, PartyMemberDefinition> = Object.fromEntries(
  partyMembers.map((member) => [member.id, member]),
)

export function getPartyFollowUpDamage(memberIds: readonly string[], playerLevel: number): number {
  const levelBonus = Math.max(0, Math.floor(playerLevel) - 1)
  return memberIds.reduce((total, memberId) => {
    const member = partyMemberById[memberId]
    return total + (member ? member.attack + levelBonus : 0)
  }, 0)
}

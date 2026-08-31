export type PartyMemberDefinition = {
  id: string
  name: string
  role: string
  /** Damage dealt by the member's single follow-up after a player action. */
  attack: number
  glyph: string
}

export const partyMembers: readonly PartyMemberDefinition[] = [
  {
    id: 'byte',
    name: 'BYTE',
    role: 'SCOUT',
    attack: 7,
    glyph: 'B',
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

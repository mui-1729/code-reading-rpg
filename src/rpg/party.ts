export type PartyMemberDefinition = {
  id: string
  name: string
  role: string
  /** Damage dealt by the member's single follow-up at Rank 1. */
  baseFollowUpDamage: number
  /** Extra follow-up damage gained for each Rank after Rank 1. */
  followUpDamagePerRank: number
  glyph: string
}

export type PartyMemberGrowth = {
  rank: number
  followUpDamage: number
  nextRankAtPlayerLevel: number | null
}

export const PARTY_MAX_RANK = 5

export const partyMembers: readonly PartyMemberDefinition[] = [
  {
    id: 'byte',
    name: 'BYTE',
    role: 'SCOUT',
    baseFollowUpDamage: 7,
    followUpDamagePerRank: 2,
    glyph: 'B',
  },
]

export const partyMemberById: Record<string, PartyMemberDefinition> = Object.fromEntries(
  partyMembers.map((member) => [member.id, member]),
)

/**
 * Party Rank is a lightweight, grind-free growth track shared by every member.
 * It advances at Player Lv 1 / 3 / 5 / 7 / 9 and is derived instead of saved,
 * so existing saves need no migration and newly joined members immediately match
 * the current adventure progression.
 */
export function getPartyRank(playerLevel: number): number {
  const normalizedLevel = Math.max(1, Math.floor(playerLevel))
  return Math.min(PARTY_MAX_RANK, 1 + Math.floor((normalizedLevel - 1) / 2))
}

export function getPartyMemberGrowth(
  memberId: string,
  playerLevel: number,
): PartyMemberGrowth | null {
  const member = partyMemberById[memberId]
  if (!member) return null

  const rank = getPartyRank(playerLevel)
  return {
    rank,
    followUpDamage: member.baseFollowUpDamage + (rank - 1) * member.followUpDamagePerRank,
    nextRankAtPlayerLevel: rank >= PARTY_MAX_RANK ? null : rank * 2 + 1,
  }
}

export function getPartyFollowUpDamage(memberIds: readonly string[], playerLevel: number): number {
  return memberIds.reduce((total, memberId) => {
    const growth = getPartyMemberGrowth(memberId, playerLevel)
    return total + (growth?.followUpDamage ?? 0)
  }, 0)
}

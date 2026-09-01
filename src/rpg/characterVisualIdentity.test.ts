import { describe, expect, it } from 'vitest'
import { characterVisualIdentity, characterVisuals } from './visualAssets'

describe('character visual identity', () => {
  it('BYTEはfield sprite流用ではなく会話専用portraitを持つ', () => {
    expect(characterVisuals.byte.portrait).toBe('/pixel-art/characters/byte-portrait.svg')
    expect(characterVisuals.byte.portrait).not.toBe(characterVisuals.byte.field)
  })

  it('主要characterはpalette以外のsilhouette identityを一意に持つ', () => {
    const identities = Object.values(characterVisualIdentity)
    const silhouettes = identities.map((identity) => identity.silhouette)

    expect(identities).toHaveLength(5)
    expect(new Set(silhouettes).size).toBe(identities.length)
    expect(identities.every((identity) => identity.cues.length >= 2)).toBe(true)
  })

  it('ADA / MIO / WARDEN / BYTEにissueで定めたstrong cueを固定する', () => {
    expect(characterVisualIdentity.leadAda.cues).toContain('headset-mic')
    expect(characterVisualIdentity.trainerMio.cues).toContain('high-bun')
    expect(characterVisualIdentity.typeWarden.cues).toContain('oversized-pauldrons')
    expect(characterVisualIdentity.byte.cues).toContain('antenna')
  })

  it('PLAYERもNPCとは別のhelmeted knight silhouetteとして定義する', () => {
    expect(characterVisualIdentity.player.silhouette).toBe('helmeted-armed-knight')
    expect(characterVisualIdentity.player.cues).toContain('helmet')
    expect(characterVisualIdentity.player.cues).toContain('weapon')
  })
})

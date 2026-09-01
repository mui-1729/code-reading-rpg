import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { characterVisuals } from './visualAssets'

const readCharacterSvg = (fileName: string) =>
  readFileSync(new URL(`../../public/pixel-art/characters/${fileName}`, import.meta.url), 'utf8')

const silhouetteSignature = (svg: string) =>
  Array.from(svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"\/>/g))
    .map((match) => match.slice(1).join(':'))
    .join('|')

describe('character visual identity', () => {
  it('BYTEはfield sprite流用ではなく会話専用portraitを持つ', () => {
    expect(characterVisuals.byte.portrait).toBe('/pixel-art/characters/byte-portrait.svg')
    expect(characterVisuals.byte.portrait).not.toBe(characterVisuals.byte.field)
  })

  it('ADA / MIO / WARDEN / BYTEはpaletteを無視してもrect silhouetteが重複しない', () => {
    const portraits = [
      readCharacterSvg('lead-ada-portrait.svg'),
      readCharacterSvg('trainer-mio-portrait.svg'),
      readCharacterSvg('type-warden-portrait.svg'),
      readCharacterSvg('byte-portrait.svg'),
    ]
    const signatures = portraits.map(silhouetteSignature)

    expect(signatures.every((signature) => signature.length > 0)).toBe(true)
    expect(new Set(signatures).size).toBe(signatures.length)
  })

  it('主要portraitは色以外の固有motifを持つ', () => {
    const ada = readCharacterSvg('lead-ada-portrait.svg')
    const mio = readCharacterSvg('trainer-mio-portrait.svg')
    const warden = readCharacterSvg('type-warden-portrait.svg')
    const byte = readCharacterSvg('byte-portrait.svg')

    expect(ada).toContain('<rect x="18" y="8" width="2" height="5"/>')
    expect(mio).toContain('<rect x="10" y="1" width="5" height="3"/>')
    expect(warden).toContain('<rect x="1" y="17" width="5" height="6"/>')
    expect(byte).toContain('<rect x="16" y="1" width="2" height="3"/>')
  })

  it('MIOのfield spriteにもportraitと同じ高いbun motifを残す', () => {
    const field = readCharacterSvg('trainer-mio-field.svg')
    expect(field).toContain('<rect x="7" y="1" width="4" height="3"/>')
  })
})

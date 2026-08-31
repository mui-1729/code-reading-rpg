import { describe, expect, it } from 'vitest'
import { battles } from './battles'
import { getBattlePresentation } from './battlePresentation'

describe('battle presentation identity', () => {
  it('すべてのauthored Battleへscene / arena / BGMを割り当てる', () => {
    for (const battle of battles) {
      const presentation = getBattlePresentation(battle)
      expect(presentation.sceneId).toBeTruthy()
      expect(presentation.locationLabel).toBeTruthy()
      expect(presentation.bgmTrack).toBeTruthy()
      expect(['incident', 'training', 'field', 'boss']).toContain(presentation.arenaKind)
    }
  })

  it('Village training / Forest / Deep Forest / TypeScriptを別sceneとして扱う', () => {
    const byId = (id: number) => getBattlePresentation(battles.find((battle) => battle.id === id)!)

    expect(byId(7).sceneId).toBe('village-training')
    expect(byId(10).sceneId).toBe('javascript-forest')
    expect(byId(15).sceneId).toBe('javascript-deep-forest')
    expect(byId(4).sceneId).toBe('typescript-frontier')
  })

  it('JS / TS Final BossはsceneとBGMの両方を共有しない', () => {
    const javascript = getBattlePresentation(battles.find((battle) => battle.id === 3)!)
    const typescript = getBattlePresentation(battles.find((battle) => battle.id === 6)!)

    expect(javascript.arenaKind).toBe('boss')
    expect(typescript.arenaKind).toBe('boss')
    expect(javascript.sceneId).not.toBe(typescript.sceneId)
    expect(javascript.bgmTrack).not.toBe(typescript.bgmTrack)
  })
})

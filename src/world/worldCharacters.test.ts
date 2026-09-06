import { describe, expect, it } from 'vitest'
import {
  getWorldNpcDefinition,
  getWorldNpcDialogue,
  WORLD_NPC_PLACEMENTS,
} from './worldCharacters'
import {
  JS_VILLAGE_MAP_ID,
  TS_BOSS_POSITION,
  TS_FRONTIER_MAP_ID,
} from './worldMap'
import { TS_FRONTIER_OUTPOST_WARDEN_POSITION } from './typescriptFrontierOutpost'

describe('World character placements', () => {
  it('current Worldへ置く全NPCがcanonical dialogue definitionを参照する', () => {
    for (const placement of WORLD_NPC_PLACEMENTS) {
      expect(getWorldNpcDefinition(placement).id).toBe(placement.npcId)
    }
  })

  it('Greenfield Villageにmain trainer以外のordinary residentsを複数置く', () => {
    const village = WORLD_NPC_PLACEMENTS.filter(
      (placement) => placement.mapId === JS_VILLAGE_MAP_ID,
    )
    const residents = village.filter(
      (placement) => getWorldNpcDefinition(placement).role === 'resident',
    )

    expect(residents.length).toBeGreaterThanOrEqual(3)
    expect(residents.every((placement) => placement.optional)).toBe(true)
    expect(residents.every((placement) => placement.storyThread)).toBe(true)
  })

  it('TypeScript境界監視所に複数の常駐NPCを置く', () => {
    const frontier = WORLD_NPC_PLACEMENTS.filter(
      (placement) => placement.mapId === TS_FRONTIER_MAP_ID,
    )

    expect(frontier.map((placement) => placement.npcId)).toEqual(
      expect.arrayContaining(['type-warden', 'compiler-scout', 'narrowing-scholar']),
    )
    expect(frontier.length).toBeGreaterThanOrEqual(3)
  })

  it('TYPE WARDENは境界監視所のmain NPCとしてBattle 6のFrontier Compilerと分離する', () => {
    const warden = WORLD_NPC_PLACEMENTS.find((placement) => placement.npcId === 'type-warden')

    expect(warden?.mapId).toBe(TS_FRONTIER_MAP_ID)
    expect(warden?.position).toEqual(TS_FRONTIER_OUTPOST_WARDEN_POSITION)
    expect(warden?.position).not.toEqual(TS_BOSS_POSITION)
    expect(warden?.optional).toBe(false)
  })

  it('MIOはTraining前後、residentはArea clear前後で再訪会話が変わる', () => {
    const mio = WORLD_NPC_PLACEMENTS.find((placement) => placement.npcId === 'trainer-mio')
    const child = WORLD_NPC_PLACEMENTS.find((placement) => placement.npcId === 'village-child')
    if (!mio || !child) throw new Error('expected World NPC placements')

    expect(
      getWorldNpcDialogue(mio, { clearedStageIds: [], clearedAreaIds: [] }).dialogue.id,
    ).toBe('mio-start')
    expect(
      getWorldNpcDialogue(mio, { clearedStageIds: [7, 8, 9], clearedAreaIds: [] }).dialogue.id,
    ).toBe('mio-training-complete')
    expect(
      getWorldNpcDialogue(child, { clearedStageIds: [], clearedAreaIds: [] }).dialogue.id,
    ).toBe('child-start')
    expect(
      getWorldNpcDialogue(child, {
        clearedStageIds: [1, 2, 3],
        clearedAreaIds: ['javascript'],
      }).dialogue.id,
    ).toBe('child-area-clear')
  })
})

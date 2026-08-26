import { describe, expect, it } from 'vitest'
import { getDialogueForNpc, matchesDialogueCondition } from './dialogue'
import { npcById } from './npcs'

const progress = {
  level: 1,
  clearedStageIds: [] as number[],
  clearedAreaIds: [] as string[],
}

describe('dialogue selection', () => {
  it('Level / Stage / Area条件を進行状態から評価する', () => {
    expect(matchesDialogueCondition({ kind: 'always' }, progress)).toBe(true)
    expect(matchesDialogueCondition({ kind: 'minLevel', level: 2 }, progress)).toBe(false)
    expect(
      matchesDialogueCondition(
        { kind: 'stageCleared', stageId: 1 },
        { ...progress, clearedStageIds: [1] },
      ),
    ).toBe(true)
    expect(
      matchesDialogueCondition(
        { kind: 'areaCleared', areaId: 'javascript' },
        { ...progress, clearedAreaIds: ['javascript'] },
      ),
    ).toBe(true)
  })

  it('JavaScript Objective NPCはStage進行に応じて次の目的を切り替える', () => {
    const archivist = npcById['archivist']

    expect(getDialogueForNpc(archivist, progress).id).toBe('archivist-start')
    expect(
      getDialogueForNpc(archivist, { ...progress, level: 2, clearedStageIds: [1] }).id,
    ).toBe('archivist-stage-1')
    expect(
      getDialogueForNpc(archivist, { ...progress, level: 2, clearedStageIds: [1, 2] }).id,
    ).toBe('archivist-stage-2')
    expect(
      getDialogueForNpc(archivist, {
        ...progress,
        level: 3,
        clearedStageIds: [1, 2, 3],
        clearedAreaIds: ['javascript'],
      }).id,
    ).toBe('archivist-area-clear')
  })

  it('JavaScript Hint NPCはLevel条件を使って発展ヒントへ切り替えられる', () => {
    const sage = npcById['lambda-sage']

    expect(getDialogueForNpc(sage, progress).id).toBe('lambda-start')
    expect(
      getDialogueForNpc(sage, { ...progress, level: 2, clearedStageIds: [1] }).id,
    ).toBe('lambda-stage-1')
    expect(
      getDialogueForNpc(sage, { ...progress, level: 3, clearedStageIds: [1, 2] }).id,
    ).toBe('lambda-level-3')
  })

  it('TypeScript Objective NPCはStage 4→5→Boss→Area CLEARへ案内を切り替える', () => {
    const warden = npcById['type-warden']

    expect(getDialogueForNpc(warden, progress).id).toBe('type-warden-start')
    expect(
      getDialogueForNpc(warden, { ...progress, clearedStageIds: [4] }).id,
    ).toBe('type-warden-stage-4')
    expect(
      getDialogueForNpc(warden, { ...progress, level: 2, clearedStageIds: [4, 5] }).id,
    ).toBe('type-warden-stage-5')
    expect(
      getDialogueForNpc(warden, {
        ...progress,
        level: 3,
        clearedStageIds: [4, 5, 6],
        clearedAreaIds: ['typescript'],
      }).id,
    ).toBe('type-warden-area-clear')
  })

  it('TypeScript Hint / Review NPCも進行状態で会話を切り替える', () => {
    const scholar = npcById['narrowing-scholar']
    const scout = npcById['compiler-scout']

    expect(getDialogueForNpc(scholar, progress).id).toBe('narrowing-scholar-start')
    expect(
      getDialogueForNpc(scholar, { ...progress, clearedStageIds: [4] }).id,
    ).toBe('narrowing-scholar-stage-4')
    expect(
      getDialogueForNpc(scholar, { ...progress, clearedStageIds: [4, 5] }).id,
    ).toBe('narrowing-scholar-stage-5')

    expect(getDialogueForNpc(scout, progress).id).toBe('compiler-scout-start')
    expect(getDialogueForNpc(scout, { ...progress, level: 3 }).id).toBe('compiler-scout-level-3')
    expect(
      getDialogueForNpc(scout, {
        ...progress,
        level: 4,
        clearedStageIds: [4, 5, 6],
        clearedAreaIds: ['typescript'],
      }).id,
    ).toBe('compiler-scout-area-clear')
  })
})

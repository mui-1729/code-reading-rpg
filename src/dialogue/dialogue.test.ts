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

  it('Objective NPCはStage進行に応じて次の目的を切り替える', () => {
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

  it('Hint NPCはLevel条件を使って発展ヒントへ切り替えられる', () => {
    const sage = npcById['lambda-sage']

    expect(getDialogueForNpc(sage, progress).id).toBe('lambda-start')
    expect(
      getDialogueForNpc(sage, { ...progress, level: 2, clearedStageIds: [1] }).id,
    ).toBe('lambda-stage-1')
    expect(
      getDialogueForNpc(sage, { ...progress, level: 3, clearedStageIds: [1, 2] }).id,
    ).toBe('lambda-level-3')
  })
})

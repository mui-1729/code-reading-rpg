import { describe, expect, it } from 'vitest'
import { npcById } from '../dialogue/npcs'
import { areas, JAVASCRIPT_AREA_ID, TYPESCRIPT_AREA_ID } from '../game/areas'
import { javascriptOpeningScenes } from './javascriptOpening'

const javascriptArea = areas.find((area) => area.id === JAVASCRIPT_AREA_ID)
const typescriptArea = areas.find((area) => area.id === TYPESCRIPT_AREA_ID)

const storyText = (areaId: 'javascript' | 'typescript', battleId: number, phase: 'pre' | 'post') => {
  const area = areaId === 'javascript' ? javascriptArea : typescriptArea
  return area?.storyEvent?.(battleId, phase)?.lines.map((line) => line.text).join(' ') ?? ''
}

describe('character continuity', () => {
  it('BYTEはOpeningからNPC会話まで僕口調を守り、旧俺/〜ぜ口調へ戻らない', () => {
    const opening = javascriptOpeningScenes
      .filter((scene) => scene.speakerId === 'byte')
      .flatMap((scene) => scene.lines)
    const npcLines = npcById['byte-scout']?.dialogues.flatMap((dialogue) => dialogue.lines) ?? []
    const battleLines = [
      storyText('javascript', 9, 'post'),
      storyText('javascript', 10, 'pre'),
      storyText('javascript', 12, 'post'),
      storyText('javascript', 3, 'pre'),
      storyText('javascript', 3, 'post'),
    ]
    const allByteText = [...opening, ...npcLines, ...battleLines].join(' ')

    expect(allByteText).toContain('僕')
    expect(allByteText).not.toMatch(/(^|[^一])俺/)
    expect(allByteText).not.toContain('しようぜ')
    expect(allByteText).not.toContain('だぜ')
  })

  it('BYTEとPLAYERの距離を一緒に見る→読み順を聞く→判断を任せるの3段階で変える', () => {
    const early = javascriptOpeningScenes
      .filter((scene) => scene.speakerId === 'byte')
      .flatMap((scene) => scene.lines)
      .join(' ')
    const middle = storyText('javascript', 10, 'pre')
    const late = storyText('javascript', 3, 'pre')

    expect(early).toContain('一緒に')
    expect(middle).toContain('どこから読む？')
    expect(late).toContain('……任せた')
  })

  it('MIOはTraining完了後も再訪会話を持ち、BYTEとの過去が会話に残る', () => {
    const mio = npcById['trainer-mio']
    const afterTraining = mio?.dialogues.find((dialogue) => dialogue.id === 'mio-training-complete')
    const trainingStory = storyText('javascript', 9, 'post')

    expect(afterTraining?.lines.join(' ')).toContain('もうTRAINへ戻らなくていい')
    expect(afterTraining?.lines.join(' ')).toContain('BYTE')
    expect(trainingStory).toContain('BYTE、先に答えを言わないこと')
    expect(trainingStory).toContain('それ今言う？')
  })

  it('ADAはObjective役だけでなく自分の失敗とPLAYERを選んだ理由を持つ', () => {
    const opening = javascriptOpeningScenes
      .filter((scene) => scene.speakerId === 'lead-ada')
      .flatMap((scene) => scene.lines)
      .join(' ')
    const ending = storyText('javascript', 3, 'post')

    expect(opening).toContain('別の場所へ問題を押し出した')
    expect(opening).toContain('「分からない」で止まれる人')
    expect(ending).toContain('新人を選んだ理由')
  })

  it('TYPE WARDENはBattle 6の敵ではなくFrontier Compilerと別人物として話す', () => {
    const before = storyText('typescript', 6, 'pre')
    const after = storyText('typescript', 6, 'post')

    expect(before).toContain('Frontier Compilerは私ではない')
    expect(before).toContain('珍しく静かだな、BYTE')
    expect(after).toContain('WARDENが敵じゃない')
  })

  it('ordinary residentsはtechnical tutorialではなく生活の話をする', () => {
    const residents = ['village-child', 'forest-traveler', 'misfire-adventurer'].map(
      (id) => npcById[id],
    )

    expect(residents.every((npc) => npc?.role === 'resident')).toBe(true)
    const text = residents.flatMap((npc) => npc?.dialogues.flatMap((entry) => entry.lines) ?? []).join(' ')
    expect(text).toContain('パン')
    expect(text).toContain('森')
    expect(text).not.toContain('find()')
    expect(text).not.toContain('filter()')
  })
})

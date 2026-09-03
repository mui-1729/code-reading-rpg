import type { BattleStoryEvent } from './types'

const databaseEvents: Readonly<Record<'pre' | 'post', BattleStoryEvent>> = {
  pre: {
    id: 'db-query-reading-pre',
    label: 'ARCHIVE QUERY',
    title: '記録の並びから、先に処理する1行を読む',
    layer: 'code-world',
    lines: [
      { speaker: 'BYTE', text: 'ここは戦闘記録をrowとして保存しているArchiveみたいだ。今まで見てきたEnemyの値が、そのまま表の1行になってる。' },
      { speaker: 'SYSTEM', text: 'SELECTは取り出す列、WHEREは残す条件、ORDER BYは並べる順、LIMITは先頭から何行使うかを決める。' },
      { speaker: 'BYTE', text: 'SQLだけ見て答えを覚えなくていい。CODE DATAのrowとqueryを上から対応させれば、どのEnemyが結果になるか追える。' },
    ],
  },
  post: {
    id: 'db-query-reading-post',
    label: 'QUERY RESOLVED',
    title: 'queryとrowを対応させれば結果を追える',
    layer: 'code-world',
    lines: [
      { speaker: 'SYSTEM', text: 'QUERY TRACE COMPLETE // SELECT → WHERE → ORDER BY → LIMIT' },
      { speaker: 'BYTE', text: '配列のcodeと見た目は違うけど、やったことは同じだね。候補を絞って、順番を決めて、必要な行を取った。' },
      { speaker: 'BYTE', text: 'これは入口だけ。Databaseの奥では、複数tableや集計を読む必要がありそうだ。いったんArchive入口へ戻ろう。' },
    ],
  },
}

export function getDatabaseBattleEvent(
  battleId: number,
  phase: 'pre' | 'post',
): BattleStoryEvent | undefined {
  if (battleId !== 23) return undefined
  return databaseEvents[phase]
}

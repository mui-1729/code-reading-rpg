import type { BattleStoryEvent } from './types'

export function getDatabaseBattleEvent(battleId: number, phase: 'pre' | 'post'): BattleStoryEvent | undefined {
  if (battleId !== 23) return undefined
  return phase === 'pre' ? {
    id:'db-first-record-query',label:'DATABASE // THE LOST RECORD',title:'消えた記録を探す',
    lines:[
      {speakerId:'player',speaker:'PLAYER',role:'新人エンジニア',layer:'remote',text:'APIの型は正しいのに、必要な記録が届かない。保存された行を取り出すqueryも追ってみよう。'},
      {speakerId:'byte',speaker:'BYTE',role:'相棒',layer:'code-world',text:'地下書庫の守り手は台帳の一行と結びついている。tableは表、rowは一行、columnは項目だ。CODE DATAでenemiesの行を見られるよ。'},
      {speakerId:'byte',speaker:'BYTE',role:'相棒',text:'FROMで読む表、WHEREで残す条件、ORDER BYで優先順、LIMITで取得する上限を読む。ASCは小さい順、DESCは大きい順。'},
      {speakerId:'player',speaker:'PLAYER',role:'調査する冒険者',text:'SELECT idは識別子を返すんだね。術の名前で決めず、条件と順番を台帳の値に当てはめてみる。'},
    ],
  } : {
    id:'db-record-restored',label:'DATABASE // RECORD RESTORED',title:'台帳に灯が戻る',
    lines:[
      {speakerId:'byte',speaker:'BYTE',role:'相棒',text:'書庫の記録が読めるようになった。条件だけでなく、順番と件数でも取り出す行は変わるんだ。'},
      {speakerId:'player',speaker:'PLAYER',role:'新人エンジニア',layer:'remote',text:'表の値とqueryを照らし合わせて、必要な記録が届かない理由を調べる手がかりが増えた。'},
    ],
  }
}

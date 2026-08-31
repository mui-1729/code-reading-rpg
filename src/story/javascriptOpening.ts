import type { StoryWorldLayer } from './types'

export const JAVASCRIPT_OPENING_STORAGE_KEY = 'code-read-rpg:javascript-opening:v1'

export type JavaScriptOpeningScene = {
  id: string
  layer: StoryWorldLayer
  kicker: string
  speaker: string
  lines: readonly string[]
}

export const javascriptOpeningScenes: readonly JavaScriptOpeningScene[] = [
  {
    id: 'briefing',
    layer: 'real-world',
    kicker: 'DEVELOPMENT ROOM',
    speaker: 'LEAD ADA',
    lines: [
      '今日から開発チームに入る新人エンジニアだね。さっそく最初のincidentを見てもらいたい。',
      '戦闘システムが、本来とは違う敵をtargetに選ぶようになった。まず既存コードを読んで原因を追おう。',
    ],
  },
  {
    id: 'incident',
    layer: 'real-world',
    kicker: 'INCIDENT MONITOR',
    speaker: 'BYTE',
    lines: [
      'ログ上の値は入っているのに、選ばれる敵だけがおかしい。変更履歴だけでは原因を絞れなかった。',
      'このシステムはCODE WORLDへCONNECTすると、実行中のstateとcodeの関係を探索できる。',
    ],
  },
  {
    id: 'connect',
    layer: 'connect',
    kicker: 'CONNECT',
    speaker: 'SYSTEM',
    lines: [
      'REAL WORLDのシステムを、人が歩いて調べられるfantasy worldとして展開する。',
      'ここではcodeが世界のruleだ。誰を狙うか、何が起きるかは、表示されたcodeそのものが決める。',
    ],
  },
  {
    id: 'grassland',
    layer: 'code-world',
    kicker: 'JAVASCRIPT GRASSLAND',
    speaker: 'BYTE',
    lines: [
      'CONNECT complete。現実側のtarget bugが、この世界では西の草原の戦闘異常として見えている。',
      'まず僕と合流して、実際の症状をその場で再現しよう。codeを全部理解できなくてもいい。何が分からないかも調査結果になる。',
    ],
  },
  {
    id: 'mission',
    layer: 'code-world',
    kicker: 'MISSION START',
    speaker: 'LEAD ADA // REMOTE',
    lines: [
      '最初にやるのは研修じゃない。現場でtarget異常を見て、現在のstateとcodeがどう食い違って見えるか確かめることだ。',
      '再現して読み切れない部分が見えたら、VillageのMIOに必要な読み方だけ教わって戻れ。その後はtraceをroot causeまで追う。',
    ],
  },
]

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
      'このシステムはCODE WORLDへCONNECTすると、実行中のstateとコードの関係を探索できる。',
    ],
  },
  {
    id: 'connect',
    layer: 'connect',
    kicker: 'CONNECT',
    speaker: 'SYSTEM',
    lines: [
      'REAL WORLDのシステムを、人が歩いて調べられるfantasy worldとして展開する。',
      'ここではコードが世界のruleだ。誰を狙うか、何が起きるかは、表示されたコードそのものが決める。',
    ],
  },
  {
    id: 'grassland',
    layer: 'code-world',
    kicker: 'JAVASCRIPT GRASSLAND',
    speaker: 'BYTE',
    lines: [
      'CONNECT complete。ここがCODE WORLDのJavaScript草原だ。現実側のtarget bugが、この世界では戦闘の異変として見えている。',
      'まずHubで僕と合流して、西の草原へ行こう。同じincidentをCODE WORLD側から追うんだ。',
    ],
  },
  {
    id: 'mission',
    layer: 'code-world',
    kicker: 'MISSION START',
    speaker: 'LEAD ADA // REMOTE',
    lines: [
      'コードは嘘をつかない。現在のstateと処理順を追えば、異変と現実のbugは同じ原因につながる。',
      'HubでBYTEと合流し、西のJavaScript草原で最初の症状を調査してくれ。',
    ],
  },
]

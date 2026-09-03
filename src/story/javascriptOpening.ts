import type { StoryWorldLayer } from './types'

export const JAVASCRIPT_OPENING_STORAGE_KEY = 'code-read-rpg:javascript-opening:v1'

export type JavaScriptOpeningScene = {
  id: string
  layer: StoryWorldLayer
  kicker: string
  speakerId: string
  speaker: string
  lines: readonly string[]
}

export const javascriptOpeningScenes: readonly JavaScriptOpeningScene[] = [
  {
    id: 'briefing',
    layer: 'real-world',
    kicker: 'DEVELOPMENT ROOM',
    speakerId: 'lead-ada',
    speaker: 'LEAD ADA',
    lines: [
      '今日から開発チームに入る新人エンジニアだね。私はADA。さっそく最初のincidentを見てもらいたい。',
      '戦闘システムが、本来とは違う敵をtargetに選ぶようになった。急いで直すより、まず既存コードを読んで何が起きているか確かめよう。',
      '私は前に、症状だけを急いで塞いで別の場所へ問題を押し出したことがある。だから今回は「分からない」で止まれる人を現場へ送る。',
    ],
  },
  {
    id: 'incident',
    layer: 'real-world',
    kicker: 'INCIDENT MONITOR',
    speakerId: 'byte',
    speaker: 'BYTE',
    lines: [
      '僕はBYTE。ログを拾って変な動きを見つけるのは得意なんだけど、見つけると先に答えを決めたくなる癖がある。',
      '今回も値は入っているのに、選ばれる敵だけがおかしい。僕一人だと仮説へ走りそうだから、一緒に現場を見てほしい。',
    ],
  },
  {
    id: 'connect',
    layer: 'connect',
    kicker: 'CONNECT',
    speakerId: 'system',
    speaker: 'SYSTEM',
    lines: [
      'REAL WORLDのシステムを、人が歩いて調べられるfantasy worldとして展開する。',
      'Code KnightはREAL WORLDからCONNECTし、codeを読むことでこの世界のruleを確かめ、異常の原因を追う調査役だ。',
      'ここではcodeが世界のruleだ。誰を狙うか、何が起きるかは、表示されたcodeそのものが決める。',
    ],
  },
  {
    id: 'grassland',
    layer: 'code-world',
    kicker: 'JAVASCRIPT GRASSLAND',
    speakerId: 'byte',
    speaker: 'BYTE',
    lines: [
      'CONNECT complete。現実側のtarget bugが、この世界では西の草原の戦闘異常として見えている。',
      '草原や村、森はlessonのために並んだstageじゃない。ここで暮らす人たちの道や生活の中に、現実側の異変が重なって見えている。',
      'まず僕と合流して、一緒に実際の症状を見よう。codeを全部理解できなくてもいい。何が分からないかも調査結果になる。',
    ],
  },
  {
    id: 'mission',
    layer: 'code-world',
    kicker: 'MISSION START',
    speakerId: 'lead-ada',
    speaker: 'LEAD ADA // REMOTE',
    lines: [
      '最初にやるのは研修じゃない。現場でtarget異常を見て、現在のstateとcodeがどう見えるか確かめることだ。',
      '読み切れない部分が見えたらVillageのMIOを頼れ。MIOはBYTEが一人で走り出す前から、何度も足を止めさせてきた人だ。',
    ],
  },
]

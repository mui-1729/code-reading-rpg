export const JAVASCRIPT_OPENING_STORAGE_KEY = 'code-read-rpg:javascript-opening:v1'

export type JavaScriptOpeningScene = {
  id: string
  kicker: string
  speaker: string
  lines: readonly string[]
}

export const javascriptOpeningScenes: readonly JavaScriptOpeningScene[] = [
  {
    id: 'kingdom',
    kicker: 'JAVASCRIPT KINGDOM',
    speaker: 'NARRATION',
    lines: [
      'JavaScript王国では、門も店も戦闘システムも、たくさんのコードで動いている。',
      '人々はその仕組みを意識することなく、今日もいつも通り暮らしていた。',
    ],
  },
  {
    id: 'error',
    kicker: 'SYSTEM ERROR',
    speaker: 'NARRATION',
    lines: [
      'ところがある朝、西の草原で戦闘システムが突然おかしな敵を狙い始めた。',
      '誰もコードを変えた覚えはない。小さなバグに見えた異常は、少しずつ広がっていく。',
    ],
  },
  {
    id: 'ada',
    kicker: 'DEVELOPMENT ROOM',
    speaker: 'LEAD ADA',
    lines: [
      '君が今日からチームに入る新人Code Knightだね。ちょうどいい、最初の仕事を頼みたい。',
      '壊れた戦闘システムのコードを読んで、なぜ違う敵を選ぶのか突き止めてくれ。',
    ],
  },
  {
    id: 'byte',
    kicker: 'DEBUG LOG',
    speaker: 'BYTE',
    lines: [
      '僕はBYTE。ログを集めておいた。値はちゃんと入ってるのに、選ばれる敵だけがおかしい。',
      '一緒に追えばきっと見つかる。まずは西のJavaScript草原へ行こう。',
    ],
  },
  {
    id: 'mission',
    kicker: 'MISSION START',
    speaker: 'LEAD ADA',
    lines: [
      'コードは嘘をつかない。でも、読み方を間違えれば本当の動きは見えない。',
      '最初のバグを直しておいで。そこから君のプログラマーとしての冒険が始まる。',
    ],
  },
]

import { JAVASCRIPT_AREA_ID, TYPESCRIPT_AREA_ID } from '../game/areas'
import type { NpcDefinition } from './types'

export const npcDefinitions: NpcDefinition[] = [
  {
    id: 'archivist',
    name: 'LEAD ADA',
    role: 'mentor',
    roleLabel: 'SENIOR ENGINEER',
    visualId: 'lead-ada',
    dialogues: [
      {
        id: 'archivist-area-clear',
        condition: { kind: 'areaCleared', areaId: JAVASCRIPT_AREA_ID },
        lines: [
          'Code Coreは安定した。現実側の戦闘システムも正常に戻った。',
          '前に一度、目の前の症状だけ急いで塞いで、別の場所へ不具合を押し出したことがある。だから今回は、分からないところで立ち止まれる君に任せた。',
          '派手に当てる人より、読んでから動ける人の方が長いincidentでは強い。次もそのままでいい。',
        ],
      },
      {
        id: 'archivist-stage-2',
        condition: { kind: 'stageCleared', stageId: 2 },
        lines: [
          '二つの症状が同じ先へ流れている。焦って名前を付けるのはまだ早い。',
          'BYTEには現地のtraceを任せる。君は最後まで、自分で確かめたものだけを材料にして進んでくれ。',
        ],
      },
      {
        id: 'archivist-stage-1',
        condition: { kind: 'stageCleared', stageId: 1 },
        lines: [
          '最初の症状は再現できたね。原因を決めつけずに戻ってきたのは正解だ。',
          'BYTEは見つけるのが速いぶん、仮説も速い。MIOはその癖をよく知ってる。二人の間で必要な読み方だけ拾ってこよう。',
        ],
      },
      {
        id: 'archivist-start',
        condition: { kind: 'always' },
        lines: [
          '今日から開発チームに入ってもらう。君は新人Code Knightだ。',
          '私はLEAD ADA。急ぐ場面ほど、分からないことを分かったふりしない人を信用する。まず現場を見てきて。',
        ],
      },
    ],
  },
  {
    id: 'lambda-sage',
    name: 'LAMBDA',
    role: 'mentor',
    roleLabel: 'CODE MENTOR',
    visualId: null,
    dialogues: [
      {
        id: 'lambda-level-3',
        condition: { kind: 'minLevel', level: 3 },
        lines: ['長い道も一歩ずつだ。読み切れない夜は、途中で印を付けて眠ればいい。'],
      },
      {
        id: 'lambda-stage-1',
        condition: { kind: 'stageCleared', stageId: 1 },
        lines: ['森へ行くなら、水筒を忘れないこと。難しい顔をしていても喉は乾くからね。'],
      },
      {
        id: 'lambda-start',
        condition: { kind: 'always' },
        lines: ['ここでは皆、何かを読み違える。恥ずかしいのは間違えることより、確かめないことさ。'],
      },
    ],
  },
  {
    id: 'byte-scout',
    name: 'BYTE',
    role: 'scout',
    roleLabel: 'DEBUGGER',
    visualId: 'byte',
    dialogues: [
      {
        id: 'byte-area-clear',
        condition: { kind: 'areaCleared', areaId: JAVASCRIPT_AREA_ID },
        lines: [
          '西の森、静かになったね。最初は僕が全部説明しないとって思ってた。',
          'でも後半は、君が止まった場所だけ見れば十分だった。次も僕は横でtraceを見失わないようにするよ。',
        ],
      },
      {
        id: 'byte-level-2',
        condition: { kind: 'minLevel', level: 2 },
        lines: [
          '僕、ログを拾うのは得意なんだけど、怪しいものを見つけると先に答えを決めたくなるんだ。MIOには昔からそこを怒られてる。',
          'だから今度は僕が決めない。どこから読むか、先に君の考えを聞かせて。',
        ],
      },
      {
        id: 'byte-start',
        condition: { kind: 'always' },
        lines: [
          '僕はBYTE。足跡みたいに残ったログを追うのが好きなんだ。',
          '一人だと見つけた瞬間に走り出しちゃうから、今回は君と一緒に見たい。分からないところもそのまま持っていこう。',
        ],
      },
    ],
  },
  {
    id: 'trainer-mio',
    name: 'TRAINER MIO',
    role: 'mentor',
    roleLabel: 'VILLAGE GUIDE',
    visualId: 'trainer-mio',
    dialogues: [
      {
        id: 'mio-area-clear',
        condition: { kind: 'areaCleared', areaId: JAVASCRIPT_AREA_ID },
        lines: [
          'おかえり。森の方から聞こえていた嫌な音、止まったね。',
          'BYTEも少し変わったでしょ。前は答えを見つけると人の話を最後まで聞かなかった。君と組ませて正解だったみたい。',
        ],
      },
      {
        id: 'mio-training-complete',
        condition: { kind: 'stageCleared', stageId: 9 },
        lines: [
          'もうTRAINへ戻らなくていいよ。ここからは森で、自分の読み方を使う番。',
          'BYTE、先に答えを言わないこと。昔みたいに一人で走って木にぶつからない。',
          'BYTEなら「それ今言う？」って顔をするだろうけど、君なら分かるよね。二人で帰っておいで。',
        ],
      },
      {
        id: 'mio-training-progress',
        condition: { kind: 'stageCleared', stageId: 7 },
        lines: [
          '一つ読めたら十分。BYTEは三つ先まで走りたがるけど、私は一つずつ確かめる方が好き。',
          '次も分からないところだけ持ってきて。全部を授業にするつもりはないよ。',
        ],
      },
      {
        id: 'mio-start',
        condition: { kind: 'always' },
        lines: [
          'BYTEから聞いてるよ。私はMIO。この村で旅人が足を止める場所を守ってる。',
          '現場で引っかかったところだけ、一緒に小さくしよう。終わったらちゃんと森へ返すから安心して。',
        ],
      },
    ],
  },
  {
    id: 'village-child',
    name: 'VILLAGE CHILD',
    role: 'resident',
    roleLabel: 'GREENFIELD RESIDENT',
    visualId: null,
    dialogues: [
      {
        id: 'child-area-clear',
        condition: { kind: 'areaCleared', areaId: JAVASCRIPT_AREA_ID },
        lines: ['森の音、静かになった！ 今度BYTEと競走するんだ。あの子、曲がり角だけちょっと苦手なんだよ。'],
      },
      {
        id: 'child-start',
        condition: { kind: 'always' },
        lines: ['旅の人？ MIOは怖くないよ。声が静かなときの方が、だいたい本気で心配してるだけ。'],
      },
    ],
  },
  {
    id: 'forest-traveler',
    name: 'FOREST TRAVELER',
    role: 'resident',
    roleLabel: 'WEARY TRAVELER',
    visualId: null,
    dialogues: [
      {
        id: 'traveler-area-clear',
        condition: { kind: 'areaCleared', areaId: JAVASCRIPT_AREA_ID },
        lines: ['西の道が落ち着いたって？ なら明日の朝に出るよ。村のパンを三つも買っちまったしな。'],
      },
      {
        id: 'traveler-start',
        condition: { kind: 'always' },
        lines: ['森から戻ってきたところだ。奥へ行くほど木々がざわついて、獣まで落ち着かなくてね。今日はここで休むよ。'],
      },
    ],
  },
  {
    id: 'misfire-adventurer',
    name: 'WANDERING ADVENTURER',
    role: 'resident',
    roleLabel: 'STRANDED ADVENTURER',
    visualId: null,
    dialogues: [
      {
        id: 'adventurer-area-clear',
        condition: { kind: 'areaCleared', areaId: JAVASCRIPT_AREA_ID },
        lines: ['技がちゃんと狙った方へ飛ぶ！ やっと旅を再開できる。次に会ったら、森の向こうの景色を教えるよ。'],
      },
      {
        id: 'adventurer-start',
        condition: { kind: 'always' },
        lines: ['この前から剣の技が狙った方へ飛ばなくてさ。腕が鈍ったのかと思って、森へ入るのをやめてたんだ。'],
      },
    ],
  },
  {
    id: 'type-warden',
    name: 'TYPE WARDEN',
    role: 'maintainer',
    roleLabel: 'FRONTIER WARDEN',
    visualId: 'type-warden',
    dialogues: [
      {
        id: 'type-warden-area-clear',
        condition: { kind: 'areaCleared', areaId: TYPESCRIPT_AREA_ID },
        lines: [
          'Frontier Compilerは静まった。私はまた、この境界を見張る仕事へ戻れる。',
          '君たちが来る前は、守ることと閉じることを同じだと思い始めていた。外から来た目は必要だな。',
        ],
      },
      {
        id: 'type-warden-stage-5',
        condition: { kind: 'stageCleared', stageId: 5 },
        lines: [
          '異変の先は東のFrontier Compilerだ。あれは私ではない。この地のcontractを解釈する古い機構だ。',
          '私はここに残って境界を支える。奥の判断は君とBYTEに任せる。',
        ],
      },
      {
        id: 'type-warden-stage-4',
        condition: { kind: 'stageCleared', stageId: 4 },
        lines: [
          '入口だけの異変ではなかったようだ。私も長くここに居すぎて、いつもの景色を疑いにくくなっていた。',
          'BYTEは騒がしいが、見慣れたものを変だと言える。それはこのFrontierでは貴重だ。',
        ],
      },
      {
        id: 'type-warden-start',
        condition: { kind: 'always' },
        lines: [
          '私はTYPE WARDEN。このFrontierを守る者だ。君たちと戦うために待っていたわけではない。',
          '東で暴れているのはFrontier Compilerだ。私は道と境界を保つ。調査は君たちに頼みたい。',
        ],
      },
    ],
  },
  {
    id: 'narrowing-scholar',
    name: 'NARROWING SCHOLAR',
    role: 'mentor',
    roleLabel: 'TYPE READING HINT',
    visualId: null,
    dialogues: [
      {
        id: 'narrowing-scholar-stage-5',
        condition: { kind: 'stageCleared', stageId: 5 },
        lines: ['古い石碑は文字より欠け方を見ると面白い。残っているものから、失われた形を想像できる。'],
      },
      {
        id: 'narrowing-scholar-stage-4',
        condition: { kind: 'stageCleared', stageId: 4 },
        lines: ['Frontierの夜は冷える。考え事をするなら焚き火の近くにしなさい。'],
      },
      {
        id: 'narrowing-scholar-start',
        condition: { kind: 'always' },
        lines: ['この土地の石は硬いが、住人まで硬くなる必要はない。旅人には温かい茶を出すのが私の流儀だ。'],
      },
    ],
  },
  {
    id: 'compiler-scout',
    name: 'COMPILER SCOUT',
    role: 'scout',
    roleLabel: 'FRONTIER SCOUT',
    visualId: null,
    dialogues: [
      {
        id: 'compiler-scout-area-clear',
        condition: { kind: 'areaCleared', areaId: TYPESCRIPT_AREA_ID },
        lines: ['東の見回りから戻った。今夜は久しぶりに、警報じゃなく風の音だけで眠れそうだ。'],
      },
      {
        id: 'compiler-scout-level-3',
        condition: { kind: 'minLevel', level: 3 },
        lines: ['奥へ行くなら靴紐を締め直せ。石段は急だ。'],
      },
      {
        id: 'compiler-scout-start',
        condition: { kind: 'always' },
        lines: ['東の巡回は私の担当だ。最近はCompilerの方から嫌な振動が来る。近づくなら足元に気をつけろ。'],
      },
    ],
  },
]

export const npcById = Object.fromEntries(npcDefinitions.map((npc) => [npc.id, npc])) as Record<
  string,
  NpcDefinition
>

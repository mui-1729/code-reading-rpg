import { JAVASCRIPT_AREA_ID, TYPESCRIPT_AREA_ID } from '../game/areas'
import type { NpcDefinition } from './types'

export const npcDefinitions: NpcDefinition[] = [
  {
    id: 'archivist',
    name: 'CAPTAIN ADA',
    role: 'ROYAL GUARD',
    dialogues: [
      {
        id: 'archivist-area-clear',
        condition: { kind: 'areaCleared', areaId: JAVASCRIPT_AREA_ID },
        lines: [
          'Code Crystalの光が戻った。西の草原の魔物たちも落ち着き始めている。',
          '砦のBossはCrystalの力を奪って、魔物を暴走させていたんだ。',
          '君が止めてくれたおかげでJavaScript王国は救われた。ありがとう。',
        ],
      },
      {
        id: 'archivist-stage-2',
        condition: { kind: 'stageCleared', stageId: 2 },
        lines: [
          'やはり黒い結晶は西の砦から流れ出していた。',
          '門の奥に強い魔力を感じる。そこに今回の異変を起こしたBossがいるはずだ。',
          'ここまで来たら最後まで行こう。Code Crystalを取り戻すんだ。',
        ],
      },
      {
        id: 'archivist-stage-1',
        condition: { kind: 'stageCleared', stageId: 1 },
        lines: [
          '魔物が持っていたその黒い欠片……Code Crystalの一部に似ている。',
          'BYTEから、さらに西でも同じ欠片を見たと連絡が来た。異変はまだ続いている。',
          '次は奥の草原へ進もう。何が起きているのか確かめるんだ。',
        ],
      },
      {
        id: 'archivist-start',
        condition: { kind: 'always' },
        lines: [
          '西の草原で魔物が突然暴れ始めた。村へ近づく群れも増えている。',
          'しかも王国を守るCode Crystalの光が、同じ頃から弱くなっているんだ。',
          'まず草原へ向かってくれ。魔物を止めて、異変の手がかりを探そう。',
        ],
      },
    ],
  },
  {
    id: 'lambda-sage',
    name: 'SAGE LAMBDA',
    role: 'COURT SCHOLAR',
    dialogues: [
      {
        id: 'lambda-level-3',
        condition: { kind: 'minLevel', level: 3 },
        lines: [
          '西の砦には強い魔物が集まっている。慌てず、技に刻まれた式を上から読めばいい。',
          '複数の敵から誰を選ぶ技なのか分かれば、Bossまでの道はきっと開ける。',
        ],
      },
      {
        id: 'lambda-stage-1',
        condition: { kind: 'stageCleared', stageId: 1 },
        lines: [
          '草原の奥ほど敵の数も増える。次は一体だけでなく、複数の敵を選ぶ技も必要になるだろう。',
          '技の式を見て「誰に当たるのか」を落ち着いて追えば大丈夫だ。',
        ],
      },
      {
        id: 'lambda-start',
        condition: { kind: 'always' },
        lines: [
          'Code Knightの技は、刻まれたJavaScriptの式によって攻撃する相手が決まる。',
          '技名だけで決めず、式がどの敵を選ぶのか見て戦うんだ。',
        ],
      },
    ],
  },
  {
    id: 'byte-scout',
    name: 'BYTE',
    role: 'SCOUT',
    dialogues: [
      {
        id: 'byte-area-clear',
        condition: { kind: 'areaCleared', areaId: JAVASCRIPT_AREA_ID },
        lines: [
          '西の草原を見てきたけど、魔物はもう暴れてない。全部元通りだ！',
          'Code Crystalも王城に戻ったし、これでしばらく安心だな。',
          '次の旅も一緒に行こうぜ。',
        ],
      },
      {
        id: 'byte-level-2',
        condition: { kind: 'minLevel', level: 2 },
        lines: [
          '奥の草原で黒い結晶を見つけた。触れた魔物ほど激しく暴れてる。',
          '欠片は西へ行くほど増えてる。たぶん砦の方から流れてきてるぞ。',
        ],
      },
      {
        id: 'byte-start',
        condition: { kind: 'always' },
        lines: [
          '俺は斥候のBYTE。西の草原を見回ってたんだけど、今日は様子が変なんだ。',
          'SlimeもGoblinも普段よりずっと荒れてる。俺も一緒に原因を探すよ。',
        ],
      },
    ],
  },
  {
    id: 'type-warden',
    name: 'TYPE WARDEN',
    role: 'FRONTIER GUIDE',
    dialogues: [
      {
        id: 'type-warden-area-clear',
        condition: { kind: 'areaCleared', areaId: TYPESCRIPT_AREA_ID },
        lines: [
          'Frontier Compilerの停止を確認した。TypeScript FrontierはCLEARだ。',
          '型情報と実行時の条件を分けて読めたなら、別seedでも同じ考え方で突破できる。',
        ],
      },
      {
        id: 'type-warden-stage-5',
        condition: { kind: 'stageCleared', stageId: 5 },
        lines: [
          '次は北東のCOMPILER BOSS GATEだ。narrowingと`keyof`を同時に追うことになる。',
          '型で何が保証されたか、そのあと実行時にどの値を比較しているかを上から読むんだ。',
        ],
      },
      {
        id: 'type-warden-stage-4',
        condition: { kind: 'stageCleared', stageId: 4 },
        lines: [
          'Typed Entryを越えたね。次は北中央のMAYBE VALUE GATEへ。',
          '`A | B`や`?`を見たら、まず「今この値は何になり得るか」を整理してから条件式を追おう。',
        ],
      },
      {
        id: 'type-warden-start',
        condition: { kind: 'always' },
        lines: [
          'ここはTypeScript Frontier。まず北西のST4 GATEで型注釈から始めよう。',
          '型は手がかりだが、攻撃対象を決める実行時の条件も忘れずに読むこと。',
        ],
      },
    ],
  },
  {
    id: 'narrowing-scholar',
    name: 'NARROWING SCHOLAR',
    role: 'TYPE READING HINT',
    dialogues: [
      {
        id: 'narrowing-scholar-stage-5',
        condition: { kind: 'stageCleared', stageId: 5 },
        lines: [
          'narrowingでは「条件を通った後に何が確定したか」を読む。type predicateも同じ発想だ。',
          '`keyof Enemy`が出たら、keyの型だけで止まらず、実際にkeyへ入っているproperty名まで追おう。',
        ],
      },
      {
        id: 'narrowing-scholar-stage-4',
        condition: { kind: 'stageCleared', stageId: 4 },
        lines: [
          '`limit?: number`なら、読む側では`number | undefined`として考える。',
          'だから値を使う前の`!== undefined`が、後続コードでnumberとして扱える根拠になる。',
        ],
      },
      {
        id: 'narrowing-scholar-start',
        condition: { kind: 'always' },
        lines: [
          '`const limit: number = 55`の`: number`は実行時に55を変えない。',
          'TypeScriptでは「型が何を保証するか」と「式が実際に何を返すか」を分けて読むと迷いにくい。',
        ],
      },
    ],
  },
  {
    id: 'compiler-scout',
    name: 'COMPILER SCOUT',
    role: 'REVIEW SCOUT',
    dialogues: [
      {
        id: 'compiler-scout-area-clear',
        condition: { kind: 'areaCleared', areaId: TYPESCRIPT_AREA_ID },
        lines: [
          '全TypeScript Gate CLEAR。次はCLEAR済みGateを別seedで再戦してみよう。',
          '敵HPや順番が変わっても、型と実行順序を読んで同じruleへ辿り着ければ本物だ。',
        ],
      },
      {
        id: 'compiler-scout-level-3',
        condition: { kind: 'minLevel', level: 3 },
        lines: [
          'Boss前なら南側の看板も使える。narrowingと`keyof`だけ見直してから挑むのもありだ。',
          '迷ったらStage Selectへ戻って、ST4やST5を別seedで読み直すといい。',
        ],
      },
      {
        id: 'compiler-scout-start',
        condition: { kind: 'always' },
        lines: [
          'このFrontierもBattleごとにseedで盤面が変わる。答えの位置を覚えても通用しないぞ。',
          '看板は任意だ。知っている型は飛ばしてGateへ、曖昧な概念だけ確認すればいい。',
        ],
      },
    ],
  },
]

export const npcById = Object.fromEntries(npcDefinitions.map((npc) => [npc.id, npc])) as Record<
  string,
  NpcDefinition
>

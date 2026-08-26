import { JAVASCRIPT_AREA_ID, TYPESCRIPT_AREA_ID } from '../game/areas'
import type { NpcDefinition } from './types'

export const npcDefinitions: NpcDefinition[] = [
  {
    id: 'archivist',
    name: 'ARCHIVIST ADA',
    role: 'OBJECTIVE GUIDE',
    dialogues: [
      {
        id: 'archivist-area-clear',
        condition: { kind: 'areaCleared', areaId: JAVASCRIPT_AREA_ID },
        lines: [
          'JavaScript Kingdomの記録は完成した。Boss討伐、お見事。',
          'まだ読み足りなければ、緑に光るCLEAR済みGateから何度でも復習できる。',
        ],
      },
      {
        id: 'archivist-stage-2',
        condition: { kind: 'stageCleared', stageId: 2 },
        lines: [
          '次の目的は北東のBOSS GATE。推奨はLV 3だ。',
          '苦戦するなら過去のGateへ戻ってEXPを稼ぎ、コードの読み方も復習しよう。',
        ],
      },
      {
        id: 'archivist-stage-1',
        condition: { kind: 'stageCleared', stageId: 1 },
        lines: [
          '最初のGateは突破したね。次は北中央のST2へ。',
          '`find()`と`filter()`は「1つ」と「複数」の違いを意識して読むといい。',
        ],
      },
      {
        id: 'archivist-start',
        condition: { kind: 'always' },
        lines: [
          'ここはJavaScript Kingdomの読解拠点。まず北西のST1 GATEを目指そう。',
          '門の前でINTERACTするとBattleへ入れる。コードが誰を選ぶかを読んで戦うんだ。',
        ],
      },
    ],
  },
  {
    id: 'lambda-sage',
    name: 'LAMBDA SAGE',
    role: 'CODE HINT',
    dialogues: [
      {
        id: 'lambda-level-3',
        condition: { kind: 'minLevel', level: 3 },
        lines: [
          '`sort((a, b) => a.hp - b.hp)`なら、HPが小さい順に並ぶ。',
          'でもBattleでは「並べ替えたあと何を選んでいるか」まで追うこと。途中だけ読んではいけない。',
        ],
      },
      {
        id: 'lambda-stage-1',
        condition: { kind: 'stageCleared', stageId: 1 },
        lines: [
          '`find()`は条件に合う最初の1体で止まる。`filter()`は条件に合う全員を集める。',
          '同じ条件式でも結果の個数が違う。その差が攻撃対象の差になる。',
        ],
      },
      {
        id: 'lambda-start',
        condition: { kind: 'always' },
        lines: [
          '技名よりコードを見よう。たとえば`e.hp < 45`なら、まずHPが45未満かを確認する。',
          '対象プレビューは出ない。実行する前に、自分で結果を予測するのがこの国のルールだ。',
        ],
      },
    ],
  },
  {
    id: 'byte-scout',
    name: 'BYTE SCOUT',
    role: 'REVIEW SCOUT',
    dialogues: [
      {
        id: 'byte-area-clear',
        condition: { kind: 'areaCleared', areaId: JAVASCRIPT_AREA_ID },
        lines: [
          '全Gate CLEARを確認！ でもseedを変えると敵HPや並び順が変わる。',
          '同じ答えの暗記ではなく、別盤面でもコードを読めるか試してみよう。',
        ],
      },
      {
        id: 'byte-level-2',
        condition: { kind: 'minLevel', level: 2 },
        lines: [
          'LVが上がっても敵は自動で弱くならない。強くなるのは君のHPとSkill POWERだ。',
          'ST2で迷ったらST1を再戦できる。EXP稼ぎと`find()`の復習を同時にやれるぞ。',
        ],
      },
      {
        id: 'byte-start',
        condition: { kind: 'always' },
        lines: [
          '迷ったら南東の出口からStage Selectを開ける。解放状況と推奨LVを一覧で確認できるぞ。',
          'フィールドに戻れば、また好きなGateへ歩いて挑戦できる。',
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

import { JAVASCRIPT_AREA_ID } from '../game/areas'
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
]

export const npcById = Object.fromEntries(npcDefinitions.map((npc) => [npc.id, npc])) as Record<
  string,
  NpcDefinition
>

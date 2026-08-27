import { JAVASCRIPT_AREA_ID, TYPESCRIPT_AREA_ID } from '../game/areas'
import type { NpcDefinition } from './types'

export const npcDefinitions: NpcDefinition[] = [
  {
    id: 'archivist',
    name: 'LEAD ADA',
    role: 'SENIOR ENGINEER',
    dialogues: [
      {
        id: 'archivist-area-clear',
        condition: { kind: 'areaCleared', areaId: JAVASCRIPT_AREA_ID },
        lines: [
          '本番サービスの復旧を確認した。初めての障害対応、完遂だ。',
          '答えを覚えたんじゃなく、コードから原因を追えた。その読み方は次の仕事でも使える。',
        ],
      },
      {
        id: 'archivist-stage-2',
        condition: { kind: 'stageCleared', stageId: 2 },
        lines: [
          '調査ありがとう。複数の異常データは同じ障害の前兆だった。',
          '本番が落ち始めている。次はFINAL CHAPTER、Production Incidentだ。今まで読んだ構文を全部使う。',
        ],
      },
      {
        id: 'archivist-stage-1',
        condition: { kind: 'stageCleared', stageId: 1 },
        lines: [
          '最初のbug fixは通った。でもQAから「似た異常が複数ある」と連絡が来た。',
          'Chapter 2では`find()`も使いつつ、`filter()`と複数条件を読んで影響範囲を調査してほしい。',
        ],
      },
      {
        id: 'archivist-start',
        condition: { kind: 'always' },
        lines: [
          '今日から君もこの開発チームのエンジニアだ。ちょうど小さなbug reportが来ている。',
          'まずChapter 1へ。既存コードを読んで、どのデータがbugの原因か特定してみよう。',
        ],
      },
    ],
  },
  {
    id: 'lambda-sage',
    name: 'REVIEWER LAMBDA',
    role: 'CODE REVIEWER',
    dialogues: [
      {
        id: 'lambda-level-3',
        condition: { kind: 'minLevel', level: 3 },
        lines: [
          '本番障害では焦って一行だけ見ないこと。`sort()`の後に何を選び、`reduce()`が何を残すかまで追おう。',
          'コードレビューと同じだ。処理を上から追って、最終的な値を説明できれば原因に辿り着ける。',
        ],
      },
      {
        id: 'lambda-stage-1',
        condition: { kind: 'stageCleared', stageId: 1 },
        lines: [
          'レビューの基本。`find()`は最初の1件、`filter()`は条件に合う全件を返す。',
          'Chapter 2でもChapter 1の読み方は消えない。新しい構文は、知っている処理の上に積み上がる。',
        ],
      },
      {
        id: 'lambda-start',
        condition: { kind: 'always' },
        lines: [
          '新人のうちは技名を覚えるより、式が返す値を説明できるようになる方が大事だ。',
          'たとえば`e.hp < 45`なら、まず各データに条件を当てて結果を予測してから実行しよう。',
        ],
      },
    ],
  },
  {
    id: 'byte-scout',
    name: 'BYTE',
    role: 'QA ENGINEER',
    dialogues: [
      {
        id: 'byte-area-clear',
        condition: { kind: 'areaCleared', areaId: JAVASCRIPT_AREA_ID },
        lines: [
          'Production復旧を確認！ QA側の再現テストも全部greenだ。',
          'seedを変えるとデータや順番は変わる。別ケースでも読めたら、暗記じゃなく本当に理解できてるってことだな。',
        ],
      },
      {
        id: 'byte-level-2',
        condition: { kind: 'minLevel', level: 2 },
        lines: [
          '追加のbug reportをまとめた。今度は異常データが1件とは限らない。',
          '`find()`で1件を追う読み方を残したまま、`filter()`で影響範囲を洗い出そう。俺もテスト結果を追う。',
        ],
      },
      {
        id: 'byte-start',
        condition: { kind: 'always' },
        lines: [
          '俺はQAのBYTE。ユーザーから来た再現手順とテスト結果はこっちで整理する。',
          '君は実装側としてコードを読んで原因を絞ってくれ。最初のissueはChapter 1だ。',
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

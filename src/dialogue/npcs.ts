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
          '復旧確認。error rateも通常値に戻った。ここからはpostmortemだ。',
          'Root causeは「enemy配列は優先順で来る」という暗黙の前提。仕様にもtestにも存在しない順序を、selectorが頼っていた。',
          '対策は候補をfilter()で絞り、必要ならsort()やreduce()で優先順位をコードに書くこと。順番を変えたtestも追加する。',
          '小さなIssue #101を「たまたま変な1件」で終わらせず、共通前提まで追ったから本番を直せた。これが障害対応だ。',
        ],
      },
      {
        id: 'archivist-stage-2',
        condition: { kind: 'stageCleared', stageId: 2 },
        lines: [
          'impact調査の結果が出た。selectorごとに条件は違うのに、どれも入力配列の順番を信用している。共通原因だ。',
          '悪いタイミングで今日のdeployがenemy取得順を変更した。本番でtargeting missが急増、SEV-1に上げる。',
          'Finalでは「最初に見つかった値」ではなく、意図した優先順位をsort()/reduce()まで追って決める。',
        ],
      },
      {
        id: 'archivist-stage-1',
        condition: { kind: 'stageCleared', stageId: 1 },
        lines: [
          '再現できたね。`find()`は「一番弱い敵」を返すんじゃない。配列を先頭から見て、条件に最初に合った1件を返す。',
          '今のfixtureはたまたま並び順が安定していただけ。BYTEから似たreportが複数届いている。局所bugとは限らない。',
          '次はQA triage。`filter()`と複数条件を読んで、どのselectorが同じ前提を持っているか洗い出そう。',
        ],
      },
      {
        id: 'archivist-start',
        condition: { kind: 'always' },
        lines: [
          '今日から実装チームに入ってもらう。最初の担当はIssue #101、CODE ARENAのtargeting bugだ。',
          'ユーザー報告は「攻撃対象が期待と違う」。修正を急ぐ前に、まず既存JavaScriptが実際にどのEnemyを選ぶか再現して。',
          'コードを読んで事実を揃える。推測でpatchしない。それが最初の仕事だ。',
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
          'incident中ほど、コードを短く見ようとしすぎるな。`filter → sort → [0]`なら、中間配列を頭の中で作ればいい。',
          '`reduce()`は「魔法の集計」じゃない。候補を2つずつ比べて、どちらを残すかのruleを繰り返しているだけだ。',
          '優先順位を入力順に任せずコードで表現できれば、今回のroot causeを潰せる。',
        ],
      },
      {
        id: 'lambda-stage-1',
        condition: { kind: 'stageCleared', stageId: 1 },
        lines: [
          'レビュー観点を1つ。`find()`のfirst matchと「最小値」「最高優先度」は別物だ。名前がtargetでも意味は増えない。',
          'Chapter 2では`filter()`で集合を作る。`&&`は条件を狭め、`||`は候補を広げる。その結果を説明できるか確認しよう。',
        ],
      },
      {
        id: 'lambda-start',
        condition: { kind: 'always' },
        lines: [
          'bug reportよりコードを先に信じるのでも、コードより期待仕様を先に信じるのでもない。両方を比べる。',
          '`find()`を見たら「何を探すか」だけでなく「どの順番で、最初の何を返すか」まで読むんだ。',
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
          '再現test、順番shuffle test、主要seedのregression、全部green。Productionも復旧した。',
          '最初は「このseedだけ変」だった。でもseedを変えると順番が変わるからこそ、暗黙の順序依存が見えたんだな。',
          '次からQAも「同じ値で順番だけ変えるcase」を入れる。postmortemのaction itemにしておく。',
        ],
      },
      {
        id: 'byte-level-2',
        condition: { kind: 'minLevel', level: 2 },
        lines: [
          '追加reportをまとめた。単体targetだけじゃない。複数target、HPとattackDamageの複合条件でも結果が揺れる。',
          '同じEnemyでも配列順を変えると結果が変わるcaseがある。値そのものじゃなく、selectorの選び方を追ってくれ。',
        ],
      },
      {
        id: 'byte-start',
        condition: { kind: 'always' },
        lines: [
          'QAのBYTE。Issue #101はこっちで再現済み。特定seedだと「弱い敵を狙うはずなのに別の敵へ飛ぶ」って報告だ。',
          'まだ原因は断定してない。Enemyの値と並び順を変えたcaseを作るから、実装側でselectorを読んでくれ。',
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

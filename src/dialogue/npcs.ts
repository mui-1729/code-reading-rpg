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
          'Code Coreは安定した。戦闘システムも全部正常に戻ってる。',
          '最初は小さなターゲットバグに見えたけど、原因は複数の機能が使っていた共通コードだった。',
          '一つ直して終わりじゃなく、ログを追ってつながりを見つけたのが今回の勝因だ。いい仕事だったよ。',
        ],
      },
      {
        id: 'archivist-stage-2',
        condition: { kind: 'stageCleared', stageId: 2 },
        lines: [
          'ログをまとめると、異常は全部同じ共通処理につながってる。',
          '場所は西のCode Core。そこが壊れて、王国中の戦闘処理へ変な値を流してるみたいだ。',
          '次が最後。Coreの中へ入って、暴走している処理そのものを止めよう。',
        ],
      },
      {
        id: 'archivist-stage-1',
        condition: { kind: 'stageCleared', stageId: 1 },
        lines: [
          'ターゲット処理は直ったね。でも別の機能からも同じようなエラーが出始めた。',
          'BYTEがログを集めてくれてる。次は一つの関数だけじゃなく、どこまでバグが広がっているか見よう。',
          '新しいコードも増えるけど、前に読んだ処理はそのまま使う。少しずつ追えば大丈夫。',
        ],
      },
      {
        id: 'archivist-start',
        condition: { kind: 'always' },
        lines: [
          '今日からJavaScript王国の開発チームに入ってもらう。君は新人Code Knightだ。',
          '最初の仕事は戦闘システムのバグ修正。攻撃が違う敵へ飛ぶことがあるらしい。',
          '技に書かれたJavaScriptを読んで、どの敵が選ばれるのか確かめながら直していこう。',
        ],
      },
    ],
  },
  {
    id: 'lambda-sage',
    name: 'LAMBDA',
    role: 'CODE MENTOR',
    dialogues: [
      {
        id: 'lambda-level-3',
        condition: { kind: 'minLevel', level: 3 },
        lines: [
          'Code Coreの中は処理が長くなる。でも一気に全部理解しようとしなくていい。',
          'filter、sort、reduceみたいに、処理を一段ずつ追えば最後に何が選ばれるか見えてくる。',
        ],
      },
      {
        id: 'lambda-stage-1',
        condition: { kind: 'stageCleared', stageId: 1 },
        lines: [
          '次から敵が増える。複数の候補を残したり、条件を組み合わせたりするコードも出てくるよ。',
          '迷ったら「今この行で何が残ったか」だけ考えると読みやすい。',
        ],
      },
      {
        id: 'lambda-start',
        condition: { kind: 'always' },
        lines: [
          '技名よりコードを見よう。JavaScriptが実際に返した値が、そのまま攻撃対象になる。',
          'まずはfind()みたいな短い処理から読めばいい。',
        ],
      },
    ],
  },
  {
    id: 'byte-scout',
    name: 'BYTE',
    role: 'DEBUGGER',
    dialogues: [
      {
        id: 'byte-area-clear',
        condition: { kind: 'areaCleared', areaId: JAVASCRIPT_AREA_ID },
        lines: [
          'ログきれいになった！ Code Coreも戦闘システムも全部greenだ。',
          '最初の小さいバグからここまで来るとは思わなかったな。',
          '次のエリアでも変な動き見つけたら、また一緒にデバッグしようぜ。',
        ],
      },
      {
        id: 'byte-level-2',
        condition: { kind: 'minLevel', level: 2 },
        lines: [
          'ログ拾ってきた。ターゲットだけじゃなく、複数の敵を選ぶ処理でも変な結果が出てる。',
          'しかも全部、西のCode Coreを通った直後からおかしくなってる。かなり怪しいぞ。',
        ],
      },
      {
        id: 'byte-start',
        condition: { kind: 'always' },
        lines: [
          '俺はBYTE。ログを追ったり、変な動きを探したりするのが得意なんだ。',
          '最初のバグ、俺も一緒に見るよ。分からなくなったら敵のHPとコードを順番に確認しよう。',
        ],
      },
    ],
  },
  {
    id: 'type-warden',
    name: 'TYPE WARDEN',
    role: 'SYSTEM MAINTAINER',
    dialogues: [
      {
        id: 'type-warden-area-clear',
        condition: { kind: 'areaCleared', areaId: TYPESCRIPT_AREA_ID },
        lines: [
          'Shared Contractの整合性を確認した。Frontier Compilerも新旧data shapeを正常に処理している。',
          '型が保証することと実際の値・条件を分けて追えたから、根本原因まで辿り着けた。incident closeだ。',
        ],
      },
      {
        id: 'type-warden-stage-5',
        condition: { kind: 'stageCleared', stageId: 5 },
        lines: [
          'optionalとunionの異常が、同じTargetPolicy contractにつながった。',
          '次は東のFrontier Compilerだ。narrowing、generic、keyofを上から追って共通contractを直す。',
        ],
      },
      {
        id: 'type-warden-stage-4',
        condition: { kind: 'stageCleared', stageId: 4 },
        lines: [
          '入口の型注釈と実行条件は確認できた。でもAPI更新後の異常はそこだけじゃない。',
          '次はlimitが複数候補になるログと、値自体が無いログを追う。unionとoptionalを見ていこう。',
        ],
      },
      {
        id: 'type-warden-start',
        condition: { kind: 'always' },
        lines: [
          'Enemy API更新後からTypeScript Frontierのtarget処理がずれている。まず入口の処理を調査してほしい。',
          '型は手がかりだが、攻撃対象を決めるのは実行時の値と条件だ。両方をつなげて読もう。',
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
          'Shared Contractを読むときも、narrowingでは「条件を通った後に何が確定したか」を見る。type predicateも同じだ。',
          '`keyof Enemy`が出たら型名で止まらず、実際にkeyへ入っているproperty名まで追おう。',
        ],
      },
      {
        id: 'narrowing-scholar-stage-4',
        condition: { kind: 'stageCleared', stageId: 4 },
        lines: [
          '`limit?: number`なら、読む側では`number | undefined`として考える。',
          'APIから値が来ないcaseもある。だから`!== undefined`が後続でnumberとして扱える根拠になる。',
        ],
      },
      {
        id: 'narrowing-scholar-start',
        condition: { kind: 'always' },
        lines: [
          '`const limit: number = 55`の`: number`は実行時に55を変えない。',
          '今回のincidentでも「型が何を保証するか」と「式が実際に何を返すか」を分けるのが最初の一歩だ。',
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
          'Frontier Compiler green。Shared Contractの復旧を確認した。',
          '別seedでも型の保証と現在値を追って同じruleへ辿り着ければ、今回の読解は再現できる。',
        ],
      },
      {
        id: 'compiler-scout-level-3',
        condition: { kind: 'minLevel', level: 3 },
        lines: [
          'Finalは複合コードになる。narrowingと`keyof`だけ見直してからCompilerへ向かうのもありだ。',
          '一気に読むより、候補を絞る行→値を読む行→最後に選ぶ行の順で追え。',
        ],
      },
      {
        id: 'compiler-scout-start',
        condition: { kind: 'always' },
        lines: [
          'incident中でもBattleのseedで盤面は変わる。答えの位置を覚えても通用しないぞ。',
          '型情報はヒント、最終判断は現在のdata。曖昧な概念だけ看板で確認して調査を進めよう。',
        ],
      },
    ],
  },
]

export const npcById = Object.fromEntries(npcDefinitions.map((npc) => [npc.id, npc])) as Record<
  string,
  NpcDefinition
>

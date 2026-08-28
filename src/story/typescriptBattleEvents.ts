import type { BattleStoryEvent } from './types'

const postBattleEvents: Record<number, BattleStoryEvent> = {
  4: {
    id: 'ts-after-chapter-1',
    label: 'AFTER BATTLE',
    title: '入口だけの問題じゃない',
    lines: [
      {
        speaker: 'TYPE WARDEN',
        role: 'CODE WORLD MAINTAINER',
        layer: 'code-world',
        text: '入口の型注釈とEnemyの読み方は合っていた。ここで起きていたのは、型そのものより実際の条件と値の追い違いだ。',
      },
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'でも同じAPI更新のあとから、別moduleにlimitが消える症状も出てる。CODE WORLDでも異変が複数地点へ広がってる。',
      },
      {
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'remote',
        text: 'REAL WORLDのログにも同じ波及がある。次はunionとoptionalを追い、候補になれる値と今の値を分けて読もう。',
      },
    ],
  },
  5: {
    id: 'ts-after-chapter-2',
    label: 'ROOT CAUSE FOUND',
    title: 'Shared Contractにつながった',
    lines: [
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: '見つけた！ optionalなlimitもunionの設定も、別々の機能から同じTargetPolicy contractを読んでる。',
      },
      {
        speaker: 'TYPE WARDEN',
        role: 'CODE WORLD MAINTAINER',
        layer: 'code-world',
        text: 'API更新で新旧2種類のdata shapeを受けるようになった。その共通contractの絞り込みがFrontier Compilerへ集約されている。',
      },
      {
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'remote',
        text: '現実側のcall pathも同じ場所へ集約している。次はnarrowing、generic、keyofまで含む共通処理を読んでroot causeを確定しよう。',
      },
    ],
  },
  6: {
    id: 'ts-ending',
    label: 'CONTRACT RESTORED',
    title: 'TypeScript incident、解決',
    lines: [
      {
        speaker: 'TYPE WARDEN',
        role: 'CODE WORLD MAINTAINER',
        layer: 'code-world',
        text: 'Shared Contractの整合性が戻った。新旧data shapeのどちらでもFrontier Compilerが正しく絞り込めている。',
      },
      {
        speaker: 'SYSTEM',
        role: 'CONNECTOR',
        layer: 'return',
        text: 'TypeScript Frontierの修復結果をREAL WORLDへ同期。CODE WORLD sessionからRETURNする。',
      },
      {
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'real-world',
        text: '現実側のtarget処理と設定値も正常になった。API更新後のincidentはclose。今回もroot causeまで追えたな。',
      },
      {
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'real-world',
        text: 'TypeScriptは型名の暗記ではない。型が保証する範囲と、実行時に実際に読む値をつなげるのが仕事だ。',
      },
    ],
  },
}

const preBattleEvents: Record<number, BattleStoryEvent> = {
  4: {
    id: 'ts-before-chapter-1',
    label: 'NEW INCIDENT',
    title: 'API更新後の型ずれ',
    lines: [
      {
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'real-world',
        text: '次の仕事だ。Enemy API更新後からtarget結果と一部の設定値がずれるincidentが出ている。TypeScript側を調査してほしい。',
      },
      {
        speaker: 'TYPE WARDEN',
        role: 'CODE WORLD MAINTAINER',
        layer: 'remote',
        text: 'CODE WORLDのTypeScript Frontierでも、API contractの入口から異変が始まっている。こちらで現地の状態を案内する。',
      },
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'CONNECT先をTypeScript Frontierへ切り替えた。まず入口の関数で、型注釈の保証とcallbackの実条件を分けて読もう。',
      },
    ],
  },
  6: {
    id: 'ts-before-final',
    label: 'BEFORE BATTLE',
    title: 'Frontier Compilerへ',
    lines: [
      {
        speaker: 'TYPE WARDEN',
        role: 'CODE WORLD MAINTAINER',
        layer: 'code-world',
        text: 'この先がShared Contractを解釈するFrontier Compilerだ。複数moduleの型判定がここへ集約されている。',
      },
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        layer: 'code-world',
        text: 'type predicate、generic、keyofが一気に出る。でも全部、上から値を絞って最後に何を読むかって流れだ。',
      },
      {
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        layer: 'remote',
        text: 'REAL WORLDのincidentもここが最後の共通点だ。型情報と実行順序をつなげて、Shared Contractを直そう。',
      },
    ],
  },
}

export const getTypeScriptPostBattleEvent = (battleId: number) => postBattleEvents[battleId]
export const getTypeScriptPreBattleEvent = (battleId: number) => preBattleEvents[battleId]

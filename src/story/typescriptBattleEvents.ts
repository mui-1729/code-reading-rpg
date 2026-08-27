import type { BattleStoryEvent } from './types'

const postBattleEvents: Record<number, BattleStoryEvent> = {
  4: {
    id: 'ts-after-chapter-1',
    label: 'AFTER BATTLE',
    title: '入口だけの問題じゃない',
    lines: [
      {
        speaker: 'TYPE WARDEN',
        role: 'SYSTEM MAINTAINER',
        text: '入口の型注釈とEnemyの読み方は合っていた。ここで起きていたのは、型そのものより実際の条件と値の追い違いだ。',
      },
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        text: 'でも同じ更新のあとから、別moduleでlimitが40になったり60になったり、そもそも無いログも出てる。',
      },
      {
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        text: '次はunionとoptionalを追おう。候補になれる値と、今そこに入っている値を分けて読めば手掛かりが出る。',
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
        text: '見つけた！ optionalなlimitもunionの設定も、別々の機能から同じTargetPolicy contractを読んでる。',
      },
      {
        speaker: 'TYPE WARDEN',
        role: 'SYSTEM MAINTAINER',
        text: 'API更新で新旧2種類のdata shapeを受けるようになった。その共通contractの絞り込みがFrontier Compiler側へ集約されている。',
      },
      {
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        text: '次はnarrowing、generic、keyofまで含む共通処理を読む。型が何を保証したか、その後どの値を比較するかを順番に追おう。',
      },
    ],
  },
  6: {
    id: 'ts-ending',
    label: 'CONTRACT RESTORED',
    title: 'TypeScript Frontier、復旧',
    lines: [
      {
        speaker: 'TYPE WARDEN',
        role: 'SYSTEM MAINTAINER',
        text: 'Shared Contractの整合性が戻った。新旧data shapeのどちらでも、Frontier Compilerが正しく絞り込めている。',
      },
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        text: 'optionalもunionも、型だけ見てたら迷子だったね。今の値と条件まで追ったから根本原因へ届いた。',
      },
      {
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        text: 'TypeScriptの仕事は型名を暗記することじゃない。型の保証と実行時の値をつなげて読むことだ。incident close。',
      },
    ],
  },
}

const preBattleEvents: Record<number, BattleStoryEvent> = {
  4: {
    id: 'ts-before-chapter-1',
    label: 'INCIDENT',
    title: 'API更新後の型ずれ',
    lines: [
      {
        speaker: 'TYPE WARDEN',
        role: 'SYSTEM MAINTAINER',
        text: 'Enemy API更新後から、TypeScript Frontierのtarget処理で結果がずれるincidentが出ている。',
      },
      {
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        text: '最初は入口の関数から確認する。型注釈が示す保証と、callbackが実際に返す条件を分けて読もう。',
      },
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        text: 'ログは取ってある。まずBattle 4で、型が増えてもtargetの決まり方を追えるか確かめよう。',
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
        role: 'SYSTEM MAINTAINER',
        text: 'この先がShared Contractを解釈するFrontier Compilerだ。複数moduleの型判定がここへ集約されている。',
      },
      {
        speaker: 'BYTE',
        role: 'DEBUGGER',
        text: 'type predicate、generic、keyofが一気に出る。でも全部、上から値を絞って最後に何を読むかって流れだ。',
      },
      {
        speaker: 'LEAD ADA',
        role: 'SENIOR ENGINEER',
        text: '型の情報と実行順序をつなげれば読める。共通contractを直してincidentを閉じよう。',
      },
    ],
  },
}

export const getTypeScriptPostBattleEvent = (battleId: number) => postBattleEvents[battleId]
export const getTypeScriptPreBattleEvent = (battleId: number) => preBattleEvents[battleId]

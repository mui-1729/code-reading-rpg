import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { gameAudio } from '../audio/gameAudio'
import { useBgm } from '../audio/useBgm'
import { WorldInn, WorldShop } from '../economy'
import { useProgress } from '../progression'
import { characterVisuals, equipmentById, useRpg } from '../rpg'
import { openWorldTreasure } from './treasures'
import { useEncounterCue } from './useEncounterCue'
import {
  getNextJavaScriptTrainingBattleId,
  resolveWorldInteraction,
  resolveWorldMove,
} from './worldActions'
import {
  getTreasureAtPosition,
  getVisibleWorldCells,
  getWorldMapLabel,
  getWorldRegion,
  JS_DEEP_FOREST_MAP_ID,
  JS_FOREST_MAP_ID,
  JS_VILLAGE_MAP_ID,
} from './worldMap'
import { WorldCharacterLayer, WorldControls, WorldObjectiveCard, WorldViewport } from './WorldScene'
import { useWorldKeyboardControls } from './useWorldKeyboardControls'
import type { WorldPosition } from './worldSceneGeometry'
import { TYPESCRIPT_REGION_LOCKED_MESSAGE } from './regionAccess'

const regionLabels = {
  javascript: 'JavaScript 西部',
  hub: '中央ハブ',
  typescript: 'TypeScript辺境',
} as const

const terrainLabels: Record<string, string> = {
  mountain: '山',
  water: '水辺',
  road: '道',
  town: '町',
  grass: '草原',
  'tall-grass': '背の高い草むら · JavaScript',
  woods: '森 · JavaScript',
  'deep-woods': '深い森 · JavaScript',
  forest: '森 · TypeScript',
  boss: 'ボス',
  midboss: '森の中ボス',
  shop: 'ショップ',
  npc: 'NPC',
  recovery: '宿',
  treasure: '宝箱',
  village: '村の入口',
  exit: 'エリア出口',
  house: '家',
  training: 'JavaScript 訓練場',
}

export function WorldPage() {
  const navigate = useNavigate()
  const { progress, setProgress } = useProgress()
  const { rpgState, setRpgState } = useRpg()
  const [message, setMessage] = useState(
    '西の草原ではJavaScript、東側ではTypeScriptの戦闘が起こる。',
  )
  const [shopOpen, setShopOpen] = useState(false)
  const [innOpen, setInnOpen] = useState(false)
  useBgm('field')
  const { encounterCueActive, startEncounterCue } = useEncounterCue()

  const mapId = rpgState.worldMapId
  const position = rpgState.worldPosition
  const [followerPosition, setFollowerPosition] = useState<WorldPosition>(() => ({
    x: position.x,
    y: position.y + 1,
  }))
  const region = getWorldRegion(position.x, mapId)
  const visibleCells = useMemo(() => getVisibleWorldCells(position, mapId), [mapId, position])
  const byteJoined = rpgState.partyMemberIds.includes('byte')
  const viewportStart = visibleCells[0] ?? position
  const isVillage = mapId === JS_VILLAGE_MAP_ID
  const isForest = mapId === JS_FOREST_MAP_ID
  const isDeepForest = mapId === JS_DEEP_FOREST_MAP_ID
  const isLocalMap = isVillage || isForest || isDeepForest
  const nextTrainingBattleId = getNextJavaScriptTrainingBattleId(progress.clearedStageIds)

  const javascriptStoryBrief = useMemo(() => {
    if (progress.clearedAreaIds.includes('javascript') || progress.clearedStageIds.includes(3)) {
      return '西の異変は収まった。技は狙った相手へ飛ぶようになった。'
    }
    if (progress.clearedStageIds.includes(22)) {
      return 'BYTE // 二つの症状から追った経路がCode Coreへ直結した。JavaScript深層の森の西口からそのまま最終地点へ進める。'
    }
    if (progress.clearedStageIds.includes(21)) {
      return 'BYTE // 欠けたデータを含む本番ログまで一致した。残る経路は最後の集約処理だけだ。'
    }
    if (progress.clearedStageIds.includes(20)) {
      return 'BYTE // 対象候補の並び替えまで追えた。次はstatsが欠ける経路を確認しよう。'
    }
    if (progress.clearedStageIds.includes(19)) {
      return 'BYTE // 二つの異常の経路が同じ最深部へ収束した。残る対象選択処理を追おう。'
    }
    if (progress.clearedStageIds.includes(18)) {
      return 'BYTE // 群れ全体で動く障壁を読めた。Root Guardianが経路の合流点を塞いでいる。'
    }
    if (progress.clearedStageIds.includes(17)) {
      return 'BYTE // 現場の警報とsome()の真偽値が一致した。次は群れ全体を見る障壁だ。'
    }
    if (progress.clearedStageIds.includes(16)) {
      return 'BYTE // 経路でデータの形が変わる場所を追えた。この先は「一つでもあるか」だけを合図にしている。'
    }
    if (progress.clearedStageIds.includes(15)) {
      return 'BYTE // 条件が変わってもfilter()の経路を追えた。さらに西でデータの形が変わる。'
    }
    if (progress.clearedStageIds.includes(2)) {
      return 'BYTE // 二つ目の症状も同じ呼び出し経路へ入った。JavaScript深層の森を西へ進み、根本原因まで追おう。'
    }
    if (progress.clearedStageIds.includes(14)) {
      return 'BYTE // 複数の対象へ広がる影響範囲がJavaScript深層の森へ続いている。入口で二つ目の症状を確認しよう。'
    }
    if (progress.clearedStageIds.includes(13)) {
      return 'BYTE // 守り人の先で経路が複数の対象へ枝分かれした。影響範囲を全部追う必要がある。'
    }
    if (progress.clearedStageIds.includes(12)) {
      return 'BYTE // JavaScriptの森の条件合流点を追えた。経路を塞ぐ守り人を越えよう。'
    }
    if (progress.clearedStageIds.includes(9)) {
      return 'BYTE // 最初の異常で読みにくかった選択条件を自分で追えるようになった。再戦せず、その経路を西のJavaScriptの森へ追おう。'
    }
    if (progress.clearedStageIds.includes(1)) {
      return 'BYTE // 最初の対象異常は再現できた。原因を追う前に、HP・name・find()だけグリーンフィールド村で確認しよう。'
    }
    return 'LEAD ADA // 最初の仕事は対象異常の調査。BYTEと合流したら、まず草原で実際の症状をその目で確かめよう。'
  }, [progress.clearedAreaIds, progress.clearedStageIds])

  const javascriptNextObjective = useMemo(() => {
    if (progress.clearedAreaIds.includes('javascript') || progress.clearedStageIds.includes(3)) {
      return {
        label: 'JAVASCRIPT CLEAR',
        title: '西の異変は解決した',
        detail: 'JavaScript地方は落ち着いた。次の地方へ進める。',
        clear: true,
      }
    }
    if (!byteJoined) {
      return {
        label: 'NEXT OBJECTIVE',
        title: 'BYTEと合流する',
        detail: '開始地点の近くにいるBYTEへ話しかけよう。合流したら西の草原へ進み、Openingで見た対象異常をまず再現する。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(1)) {
      return {
        label: 'LIVE INCIDENT',
        title: '草原で最初の対象異常を実際に見る',
        detail: 'BYTEと西へ進もう。JavaScript側の草原へ入ると固定の異常調査が始まる。全部読めなくても、何が起きるかをまず観察する。',
        clear: false,
      }
    }
    if (nextTrainingBattleId !== null) {
      return {
        label: 'INCIDENT PREP',
        title: 'グリーンフィールド村で読めなかった部分だけ確認する',
        detail: 'グリーンフィールド村へ入り、訓練場でHP・name・find()を順番に確認する。最初の異常で分からなかった選択条件を読めるようにするためだ。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(12)) {
      const traceStep = progress.clearedStageIds.includes(11)
        ? '条件が合流する地点'
        : progress.clearedStageIds.includes(10)
          ? '別の入口から入る条件'
          : '二つの条件を両方通る枝'
      return {
        label: 'FOLLOW THE TRACE',
        title: `JavaScriptの森で${traceStep}を追う`,
        detail: '最初の症状で見た選択条件を読めるようになった。再戦ではなく、西のJavaScriptの森へ続く経路を現在の状態とコードから追おう。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(13)) {
      return {
        label: 'TRACE BLOCKED',
        title: 'JavaScriptの森の守り人を突破する',
        detail: '本道を西へ進み、経路を塞ぐ中ボスの隣から挑もう。新しい構文ではなく、今までの条件だけで突破する。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(14)) {
      return {
        label: 'IMPACT RANGE',
        title: '複数の対象へ広がった影響を全部追う',
        detail: '守り人の先の森へ進もう。find()の最初の一体だけではなく、filter()で条件に合うもの全部を追う。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(2)) {
      return {
        label: 'SECOND SYMPTOM',
        title: 'JavaScript深層の森の入口で二つ目の異常を確認する',
        detail: 'JavaScriptの森の西端の出口からJavaScript深層の森へ入ろう。最初の移動で、複数の対象へ広がった実際の異常が再現される。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(15)) {
      return {
        label: 'FOLLOW SHARED TRACE',
        title: 'JavaScript深層の森で共有経路を追い続ける',
        detail: '二つの症状は同じ呼び出し経路へ入った。森へ進み、条件が変わったfilter()でも同じ処理を読み直そう。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(22)) {
      const nextTrace = !progress.clearedStageIds.includes(16)
        ? 'データの形が変わる場所'
        : !progress.clearedStageIds.includes(17)
          ? '警報を動かす真偽値'
          : !progress.clearedStageIds.includes(18)
            ? '群れ全体で動く障壁'
            : !progress.clearedStageIds.includes(19)
              ? '経路を塞ぐRoot Guardian'
              : !progress.clearedStageIds.includes(20)
                ? '対象候補の優先順'
                : !progress.clearedStageIds.includes(21)
                  ? '欠けたデータを含む経路'
                  : '最後に一つへ集約する処理'
      return {
        label: 'ROOT TRACE',
        title: `JavaScript深層の森を西へ進み${nextTrace}を追う`,
        detail: '新しい構文を覚えるためではなく、二つの異常がどこへ集約されるかを現在のデータの流れから追い続けよう。',
        clear: false,
      }
    }
    return {
      label: 'ROOT CAUSE',
      title: 'JavaScript深層の森の西口からCode Coreへ進む',
      detail: '経路はCode Coreへ直結した。最深部の西側出口からCore手前へ抜け、そのままボスの隣から挑もう。',
      clear: false,
    }
  }, [byteJoined, nextTrainingBattleId, progress.clearedAreaIds, progress.clearedStageIds])

  const villageObjective = useMemo(() => {
    if (nextTrainingBattleId === 7) {
      return {
        label: 'INCIDENT PREP · 1 / 3',
        title: '最初の戦闘で見たHP条件を読む',
        detail: '訓練場の隣でMIOと訓練しよう。対象条件に使われていたenemy.hpと< / >だけを小さく読む。',
        clear: false,
      }
    }
    if (nextTrainingBattleId === 8) {
      return {
        label: 'INCIDENT PREP · 2 / 3',
        title: '同じログにあったname条件を読む',
        detail: '訓練場でもう一度MIOと訓練しよう。enemy.nameと===を使って、文字の値を比較する。',
        clear: false,
      }
    }
    if (nextTrainingBattleId === 9) {
      return {
        label: 'INCIDENT PREP · 3 / 3',
        title: '最初の選択処理がどこで止まったか読む',
        detail: 'enemiesを前から見て、find()が条件に合う最初の一体で止まる流れを確認する。',
        clear: false,
      }
    }
    return {
      label: 'TRACE READY',
      title: '最初の異常の続きをJavaScriptの森へ追う',
      detail: '必要な読み方は揃った。同じ戦闘をやり直すのではなく、南の出口から草原へ出て、西のJavaScriptの森へ進み、選択処理の経路を追おう。',
      clear: true,
    }
  }, [nextTrainingBattleId])

  const forestObjective = useMemo(() => {
    if (!progress.clearedStageIds.includes(1)) {
      return {
        label: 'FOREST LOCKED',
        title: '先に草原の症状を実際に見る',
        detail: 'JavaScriptの森へ進む前に、BYTEと最初の対象異常を再現しよう。何が読めないかを知ることも調査の一部だ。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(9)) {
      return {
        label: 'FOREST LOCKED',
        title: 'グリーンフィールド村で選択処理を読む材料を揃える',
        detail: '最初の異常は再現済み。MIOとHP・name・find()だけ確認してから、同じ経路をJavaScriptの森へ追おう。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(10)) {
      return {
        label: 'FOLLOW TRACE · 1',
        title: '二つの条件を両方通る枝を追う',
        detail: '森へ入り、最初の症状から伸びた経路が&&の左右をどう通るか読む。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(11)) {
      return {
        label: 'FOLLOW TRACE · 2',
        title: '別の入口から同じ処理へ入る条件を追う',
        detail: '西へ進み、||でどちらかの条件を通った状態が同じ経路へ入ることを確認する。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(12)) {
      return {
        label: 'TRACE JUNCTION',
        title: '&&と||が合流する場所を読む',
        detail: '新しい構文は増えない。かっこの内側から読み、複数条件がどの対象を先へ送るか確定する。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(13)) {
      return {
        label: 'TRACE BLOCKED',
        title: '経路を塞ぐ守り人を突破する',
        detail: '本道を西へ進み中ボスの隣から挑もう。今まで読んだ条件だけで経路を開く。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(14)) {
      return {
        label: 'IMPACT RANGE',
        title: '複数の対象へ広がる影響を全部追う',
        detail: '守り人の先の森へ入り、find()の一体ではなくfilter()で条件に合うもの全部を追う。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(2)) {
      return {
        label: 'SECOND SYMPTOM AHEAD',
        title: '西端からJavaScript深層の森へ進む',
        detail: '影響範囲の経路がJavaScript深層の森へ続いている。出口を抜けると、二つ目の実際の症状を確認できる。',
        clear: false,
      }
    }
    return {
      label: 'FOREST TRACE COMPLETE',
      title: '二つの症状は同じJavaScript深層の森へ続いた',
      detail: '調査は後戻りせず西へ続く。JavaScript深層の森で共有経路を根本原因まで追おう。',
      clear: true,
    }
  }, [progress.clearedStageIds])

  const deepForestObjective = useMemo(() => {
    if (!progress.clearedStageIds.includes(2)) {
      return {
        label: 'SECOND SYMPTOM',
        title: '複数の対象へ広がった実際の異常を再現する',
        detail: 'JavaScript深層の森へ入った直後の最初の移動で固定の異常調査が始まる。JavaScriptの森で読んだfilter() / && / ||を使って結果を追う。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(15)) {
      return {
        label: 'SHARED TRACE · FILTER',
        title: '条件が変わっても同じfilter()を追う',
        detail: '森 / 深い森へ入り、hp > 65でも最後まで見て当てはまるもの全部を集める。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(16)) {
      return {
        label: 'TRACE TRANSFORMED',
        title: 'map()でデータの形が変わる場所を追う',
        detail: '西へ進み、各Enemyが新しいオブジェクトへ変換された前後を対応させる。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(17)) {
      return {
        label: 'ALARM SIGNAL',
        title: 'some()で「一体でも」を真偽値にする',
        detail: '警報が誰を返すかではなく、条件に合うものが一つでもあるかというtrue / falseを先に決める。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(18)) {
      return {
        label: 'GROUP BARRIER',
        title: 'every()で群れ全体の状態を読む',
        detail: 'some()の「一つでも」とevery()の「全員」を区別し、障壁を動かす真偽値を追う。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(19)) {
      return {
        label: 'ROOT TRACE BLOCKED',
        title: 'Root Guardianの合流点を突破する',
        detail: '西へ進むと二つの経路を塞ぐ固定戦闘。新しい構文なしで、これまでのデータの流れを読む。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(20)) {
      return {
        label: 'TARGET PRIORITY',
        title: 'sort()で候補の優先順を読む',
        detail: 'living → byHp → byHp[0]と途中結果へ分け、複数行コードで対象が決まる順序を追う。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(21)) {
      return {
        label: 'MISSING DATA TRACE',
        title: '?. と ??で欠けたデータを含む経路を追う',
        detail: 'stats?.hpで安全に読み、値がない場合だけ??でInfinityを使う。本番ログの欠け方と照合する。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(22)) {
      return {
        label: 'FINAL TRACE',
        title: 'reduce()で最後の集約先を突き止める',
        detail: 'bestを一体ずつ更新し、複数候補が最後に何へ集約されるかを追う。',
        clear: false,
      }
    }
    return {
      label: 'ROOT CAUSE LOCATED',
      title: '西口からCode Coreへ直進する',
      detail: '経路はCode Coreへ直結した。JavaScript深層の森の西端の出口を使えばCore手前へ出られる。来た道を戻る必要はない。',
      clear: true,
    }
  }, [progress.clearedStageIds])

  const currentObjective = isVillage
    ? villageObjective
    : isDeepForest
      ? deepForestObjective
      : isForest
        ? forestObjective
        : javascriptNextObjective

  const enterBattle = useCallback(
    (battleId: number, battleRegion: 'javascript' | 'typescript', seed: string, playConfirm = true) => {
      if (playConfirm) gameAudio.playSe('confirm')
      if (battleRegion === 'javascript') {
        navigate({
          to: '/javascript/battle/$battleId',
          params: { battleId: String(battleId) },
          search: { seed, returnTo: '/world' },
        })
        return
      }
      navigate({
        to: '/typescript/battle/$battleId',
        params: { battleId: String(battleId) },
        search: { seed, returnTo: '/world' },
      })
    },
    [navigate],
  )

  const move = useCallback(
    (dx: number, dy: number) => {
      if (
        encounterCueActive ||
        shopOpen ||
        innOpen ||
        document.body.dataset.rpgPaused === 'true'
      ) return

      const result = resolveWorldMove({ rpgState, progress, dx, dy })
      if (result.kind === 'blocked') {
        gameAudio.playSe('cancel')
        setMessage(
          result.reason === 'typescript-locked'
            ? TYPESCRIPT_REGION_LOCKED_MESSAGE
            : result.terrain === 'boss'
            ? '強い魔物が道を塞いでいる。隣から挑もう。'
            : result.terrain === 'midboss'
              ? '森の守り人が道を塞いでいる。隣から挑もう。'
              : result.terrain === 'recovery'
                ? '宿だ。隣から休める。'
                : result.terrain === 'treasure'
                  ? '宝箱だ。隣から調べよう。'
                  : result.terrain === 'house'
                    ? '家がある。今は中へは入れない。'
                    : result.terrain === 'training'
                      ? '訓練場だ。隣からMIOと異常調査に必要な基礎を確認できる。'
                      : result.terrain === 'village'
                        ? !progress.clearedStageIds.includes(1)
                          ? 'グリーンフィールド村へ行く前に、BYTEと草原の最初の対象異常を実際に見よう。'
                          : 'グリーンフィールド村の入口だ。ここから入れる。'
                        : result.terrain === 'woods'
                          ? !progress.clearedStageIds.includes(1)
                            ? 'JavaScriptの森へ進む前に、BYTEと草原で最初の対象異常を実際に見よう。'
                            : !progress.clearedStageIds.includes(9)
                              ? 'JavaScriptの森へ進む前に、グリーンフィールド村で最初の異常に必要なHP・name・find()を確認しよう。'
                              : 'その先へ進むための経路がまだ開いていない。'
                          : 'そこへは進めない。',
        )
        return
      }

      if (result.kind === 'transition') {
        if (byteJoined) {
          setFollowerPosition({
            x: result.nextState.worldPosition.x,
            y: result.nextState.worldPosition.y + 1,
          })
        }
        setRpgState(result.nextState)
        gameAudio.playSe('confirm')
        setMessage(
          result.label === 'Code Core前'
            ? 'JavaScript深層の森の経路を抜けてCode Core手前へ出た。北へ進めば最終ボスだ。'
            : result.toMapId === JS_VILLAGE_MAP_ID
              ? `${result.label}へ入った。さっきの異常で読めなかった部分だけMIOと確認しよう。`
              : result.toMapId === JS_DEEP_FOREST_MAP_ID
                ? progress.clearedStageIds.includes(2)
                  ? `${result.label}へ入った。共有経路はさらに西へ続いている。`
                  : `${result.label}へ入った。最初の移動で二つ目の実際の症状を確認する。`
                : result.toMapId === JS_FOREST_MAP_ID
                  ? `${result.label}へ入った。最初の異常で見た選択処理の経路を西へ追おう。`
                  : `${result.label}へ移動した。`,
        )
        return
      }

      if (byteJoined) setFollowerPosition(position)
      setRpgState(result.nextState)
      if (result.kind === 'encounter') {
        startEncounterCue(() => {
          enterBattle(result.battle.battleId, result.battle.region, result.battle.seed, false)
        })
        return
      }

      setMessage(terrainLabels[result.terrain] ?? result.terrain)
    },
    [
      byteJoined,
      encounterCueActive,
      enterBattle,
      innOpen,
      position,
      progress,
      rpgState,
      setRpgState,
      shopOpen,
      startEncounterCue,
    ],
  )

  const interact = useCallback(() => {
    if (
      encounterCueActive ||
      shopOpen ||
      innOpen ||
      document.body.dataset.rpgPaused === 'true'
    ) return

    const intent = resolveWorldInteraction(rpgState, progress)

    if (intent.kind === 'map-transition') {
      if (byteJoined) {
        setFollowerPosition({
          x: intent.nextState.worldPosition.x,
          y: intent.nextState.worldPosition.y + 1,
        })
      }
      setRpgState(intent.nextState)
      gameAudio.playSe('confirm')
      setMessage(`${intent.label}へ入った。さっきの異常で読めなかった部分だけMIOと確認しよう。`)
      return
    }

    if (intent.kind === 'training') {
      if (intent.battleId === null) {
        gameAudio.playSe('confirm')
        setMessage('MIO: 必要な読み方は揃ったよ。同じ戦闘へ戻る必要はない。西のJavaScriptの森へ続く経路を追ってみて。')
        return
      }
      enterBattle(intent.battleId, 'javascript', `village-training:${intent.battleId}`)
      return
    }

    if (intent.kind === 'midboss') {
      if (!intent.unlocked) {
        gameAudio.playSe('cancel')
        setMessage('BYTE: まずJavaScriptの森で条件の経路を最後まで追おう。合流点まで読めれば、この守り人の先へ進める。')
        return
      }
      enterBattle(intent.battleId, intent.region, intent.seed)
      return
    }

    if (intent.kind === 'party') {
      if (intent.alreadyJoined) {
        if (!progress.clearedStageIds.includes(1)) {
          setMessage('BYTE: まず現場を見よう。西の草原へ進めば、Openingで見た対象異常を実際の状態で確認できる。')
        } else if (nextTrainingBattleId !== null) {
          setMessage('BYTE: 症状は再現できた。MIOにログを見せて、読めなかったHP・name・find()だけ確認しよう。')
        } else if (!progress.clearedStageIds.includes(12)) {
          setMessage('BYTE: 最初の症状で見た選択処理を今なら読める。経路はJavaScriptの森へ続いてるから、条件を一つずつ追おう。')
        } else if (!progress.clearedStageIds.includes(13)) {
          setMessage('BYTE: 経路が森の守り人の向こうへ集まってる。今まで読んだ条件だけで道を開こう。')
        } else if (!progress.clearedStageIds.includes(14)) {
          setMessage('BYTE: 守り人の先で影響が複数の対象へ広がってる。filter()で全部の経路を追おう。')
        } else if (!progress.clearedStageIds.includes(2)) {
          setMessage('BYTE: 影響範囲はJavaScript深層の森へ続いてる。西端の出口から入り、二つ目の実際の症状を確認しよう。')
        } else if (!progress.clearedStageIds.includes(15)) {
          setMessage('BYTE: 二つの症状は同じ経路へ入った。JavaScript深層の森を西へ進み、条件が変わっても経路を追おう。')
        } else if (!progress.clearedStageIds.includes(16)) {
          setMessage('BYTE: この先で経路のデータ形が変わる。map()の前後を対応させよう。')
        } else if (!progress.clearedStageIds.includes(17)) {
          setMessage('BYTE: 次は警報の判定。一体でも条件に合うかという真偽値を追う。')
        } else if (!progress.clearedStageIds.includes(18)) {
          setMessage('BYTE: 次の障壁は群れ全体を見る。every()で「全員」を確かめよう。')
        } else if (!progress.clearedStageIds.includes(19)) {
          setMessage('BYTE: Root Guardianが二つの経路の合流点を塞いでる。新しい構文はない。')
        } else if (!progress.clearedStageIds.includes(20)) {
          setMessage('BYTE: 最深部では対象候補を並べ替えてる。living → byHp → [0]の順で追おう。')
        } else if (!progress.clearedStageIds.includes(21)) {
          setMessage('BYTE: 本番と同じくstatsが欠けた記録がある。?.と??で経路を追おう。')
        } else if (!progress.clearedStageIds.includes(22)) {
          setMessage('BYTE: 残る経路は最後の集約だけ。reduce()でbestに何が残るか追おう。')
        } else if (!progress.clearedAreaIds.includes('javascript')) {
          setMessage('BYTE: 根本原因はCode Coreで確定した。JavaScript深層の森の西口からCore手前へ直進できる。')
        } else {
          setMessage('BYTE: 西は落ち着いたね。東にはTypeScript地方が広がっている。')
        }
        return
      }
      gameAudio.playSe('skillUnlock')
      setFollowerPosition({ x: position.x, y: position.y + 1 })
      setRpgState((current) => ({
        ...current,
        partyMemberIds: [...current.partyMemberIds, intent.memberId],
      }))
      setMessage('BYTEが仲間になった！ まず西の草原で、Openingの対象異常を一緒に見に行こう。')
      return
    }

    if (intent.kind === 'shop') {
      gameAudio.playSe('confirm')
      setShopOpen(true)
      setMessage('ショップ: アイテム / 装備を選んで購入できる。')
      return
    }

    if (intent.kind === 'recovery') {
      gameAudio.playSe('confirm')
      setInnOpen(true)
      setMessage('宿: ゴールドを払ってHPを全回復できる。')
      return
    }

    if (intent.kind === 'treasure') {
      const result = openWorldTreasure(progress, rpgState, intent.treasureId)
      if (!result.opened) {
        gameAudio.playSe('cancel')
        setMessage(`${result.definition.name}: すでに空だ。`)
        return
      }

      setProgress(result.progress)
      setRpgState(result.rpgState)
      gameAudio.playSe(result.equipmentAwarded ? 'skillUnlock' : 'confirm')

      const rewards: string[] = []
      if (result.definition.reward.gold > 0) rewards.push(`+${result.definition.reward.gold} G`)
      if (result.definition.reward.patchKit > 0) {
        rewards.push(`PATCH KIT ×${result.definition.reward.patchKit}`)
      }
      const equipmentId = result.definition.reward.equipmentId
      if (result.equipmentAwarded && equipmentId) {
        rewards.push(equipmentById[equipmentId]?.name ?? equipmentId)
      }
      setMessage(`${result.definition.name} 開封 → ${rewards.join(' / ')}`)
      return
    }

    if (intent.kind === 'boss') {
      if (!intent.unlocked) {
        setMessage(
          intent.region === 'javascript'
            ? !progress.clearedStageIds.includes(1)
              ? 'BYTEと最初の対象異常を実際に見て、何を読む必要があるか掴もう。'
              : !progress.clearedStageIds.includes(9)
                ? 'グリーンフィールド村で最初の異常に必要なHP・name・find()を確認しよう。'
                : !progress.clearedStageIds.includes(2)
                  ? 'JavaScriptの森の影響範囲を追い、JavaScript深層の森の入口で二つ目の症状を確認しよう。'
                  : 'Code Coreへ挑む前に、JavaScript深層の森の経路を根本原因まで最後まで追おう。'
            : '東の奥へ進む前に、TypeScript地方の戦闘をもう少し確かめよう。',
        )
        return
      }
      enterBattle(intent.battleId, intent.region, intent.seed)
      return
    }

    setMessage(
      isVillage
        ? nextTrainingBattleId === null
          ? '必要な確認は終わった。南の出口から草原へ出て、西のJavaScriptの森へ同じ経路を追おう。'
          : '最初の異常で読めなかった部分を、中央の訓練場でMIOと一つずつ確認しよう。'
        : isDeepForest
          ? progress.clearedStageIds.includes(22)
            ? '根本原因はCode Core。JavaScript深層の森の西端の出口からCore手前へ直進できる。'
            : !progress.clearedStageIds.includes(2)
              ? 'JavaScript深層の森へ入った。次の一歩で二つ目の実際の症状を確認する。'
              : '本道を西へ進み、森 / 深い森で共有経路を追おう。ランダム戦闘はクリア済み内容だけだ。'
          : isForest
            ? progress.clearedStageIds.includes(14)
              ? '影響範囲は西端の出口からJavaScript深層の森へ続いている。このまま先へ進もう。'
              : progress.clearedStageIds.includes(13)
                ? '守り人の先で経路が複数の対象へ広がっている。西側の森へ進もう。'
                : '木々の間に異常の経路が続いている。森と本道を西へ追おう。'
            : '近くに調べられるものはない。',
    )
  }, [
    byteJoined,
    encounterCueActive,
    enterBattle,
    innOpen,
    isDeepForest,
    isForest,
    isVillage,
    nextTrainingBattleId,
    position,
    progress,
    rpgState,
    setProgress,
    setRpgState,
    shopOpen,
  ])

  useWorldKeyboardControls({ interact, move, disabled: shopOpen || innOpen || encounterCueActive })

  return (
    <main className="app-shell world-shell title-screen">
      <section className="pixel-window world-panel">
        <header className="world-header">
          <div>
            <div className="eyebrow">
              {isLocalMap ? 'ローカルマップ' : 'オープンワールド'} //{' '}
              {isLocalMap ? getWorldMapLabel(mapId) : regionLabels[region]}
            </div>
            <h1>{isLocalMap ? getWorldMapLabel(mapId) : 'CODE WORLD'}</h1>
            <p>
              {isVillage
                ? '最初の対象異常で読めなかった部分だけをMIOと確認する村。HP・name・find()が読めたら、同じ経路をJavaScriptの森へ追う。'
                : isDeepForest
                  ? '二つの対象異常が合流した深い森。データの変換・判定・優先順・集約を追い、最深部の西口からCode Coreへつながる。'
                  : isForest
                    ? '最初の対象異常から伸びる経路を追う森。条件の分岐から複数の対象への影響拡大までを調べる。'
                    : region === 'javascript'
                      ? javascriptStoryBrief
                      : region === 'typescript'
                        ? '東側はTypeScript地方。西とは違うルールを読みながら進む。'
                        : '中央の拠点から、西のJavaScript地方と東のTypeScript地方へ進める。'}
            </p>
          </div>
        </header>

        <WorldObjectiveCard objective={currentObjective} />

        <WorldViewport
          mapId={mapId}
          playerPosition={position}
          cells={visibleCells}
          terrainLabels={terrainLabels}
          label={
            isVillage
              ? 'グリーンフィールド村のマップ'
              : isDeepForest
                ? 'JavaScript深層の森のマップ'
                : isForest
                  ? 'JavaScriptの森のマップ'
                  : 'ワールドマップ'
          }
          getTerrain={(cell) =>
            cell.terrain === 'midboss' && progress.clearedStageIds.includes(13)
              ? 'road'
              : cell.terrain
          }
          renderObject={(cell, renderedTerrain) => {
            const treasure =
              renderedTerrain === 'treasure' ? getTreasureAtPosition(cell, mapId) : undefined
            const treasureOpened = treasure
              ? rpgState.openedTreasureIds.includes(treasure.id)
              : false
            return (
              <>
                {renderedTerrain === 'boss' && (
                  <span className="world-object boss-object">ボス</span>
                )}
                {renderedTerrain === 'midboss' && (
                  <span
                    className="world-object midboss-object"
                    aria-label="JavaScriptの森 中ボス"
                  >
                    中ボス
                  </span>
                )}
                {renderedTerrain === 'shop' && (
                  <span className="world-object shop-object">ショップ</span>
                )}
                {renderedTerrain === 'village' && (
                  <span className="world-object village-object">村</span>
                )}
                {renderedTerrain === 'exit' && (
                  <span className="world-object exit-object">出口</span>
                )}
                {renderedTerrain === 'training' && (
                  <span
                    className="world-object training-object"
                    aria-label="JavaScript訓練場"
                  >
                    訓練
                  </span>
                )}
                {renderedTerrain === 'npc' && !byteJoined && (
                  <span className="world-object npc-object" aria-label="BYTE NPC">
                    <img src={characterVisuals.byte.field} alt="" />
                  </span>
                )}
                {renderedTerrain === 'recovery' && (
                  <span className="world-object recovery-object" aria-label="宿">
                    宿
                  </span>
                )}
                {treasure && (
                  <span
                    className={`world-object treasure-object ${treasureOpened ? 'opened' : ''}`}
                    aria-label={`${treasure.name} ${treasureOpened ? '開封済み' : '未開封'}`}
                  >
                    {treasureOpened ? '開封済み' : '宝箱'}
                  </span>
                )}
              </>
            )
          }}
        >
          <WorldCharacterLayer
            mapId={mapId}
            playerPosition={position}
            viewportStart={viewportStart}
            followerPosition={followerPosition}
            followerJoined={byteJoined}
          />
        </WorldViewport>

        <section className="world-message pixel-inner-window" aria-live="polite">
          <span>冒険ログ</span>
          <p>{message}</p>
        </section>

        <WorldControls move={move} interact={interact} />
      </section>

      <WorldShop open={shopOpen} onClose={() => setShopOpen(false)} onMessage={setMessage} />
      <WorldInn open={innOpen} onClose={() => setInnOpen(false)} onMessage={setMessage} />
    </main>
  )
}

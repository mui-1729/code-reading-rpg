import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { gameAudio } from '../audio/gameAudio'
import { useBgm } from '../audio/useBgm'
import { WorldInn, WorldShop } from '../economy'
import { useProgress } from '../progression'
import { characterVisuals, equipmentById, useRpg } from '../rpg'
import { openWorldTreasure } from './treasures'
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

const regionLabels = {
  javascript: 'JAVASCRIPT WEST',
  hub: 'CENTRAL HUB',
  typescript: 'TYPESCRIPT FRONTIER',
} as const

const terrainLabels: Record<string, string> = {
  mountain: 'Mountain',
  water: 'Water',
  road: 'Road',
  town: 'Town',
  grass: 'Grassland',
  'tall-grass': 'Tall Grass · JavaScript encounter',
  woods: 'Woods · JavaScript encounter',
  'deep-woods': 'Deep Woods · JavaScript encounter',
  forest: 'Forest · TypeScript encounter',
  boss: 'Boss',
  midboss: 'Forest Mid-Boss',
  shop: 'Shop',
  npc: 'NPC',
  recovery: 'Inn / Rest',
  treasure: 'Treasure',
  village: 'Village entrance',
  exit: 'Area exit',
  house: 'House',
  training: 'JavaScript Training Ground',
}

export function WorldPage() {
  const navigate = useNavigate()
  const { progress, setProgress } = useProgress()
  const { rpgState, setRpgState } = useRpg()
  const [message, setMessage] = useState(
    '西の草原ではJavaScript、東側ではTypeScriptのBattleが起こる。',
  )
  const [shopOpen, setShopOpen] = useState(false)
  const [innOpen, setInnOpen] = useState(false)
  useBgm('field')

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
      return 'BYTE // 二つの症状から追ったtraceがCode Coreへ直結した。Deep Forest西口からそのままFinalへ進める。'
    }
    if (progress.clearedStageIds.includes(21)) {
      return 'BYTE // 欠けたdataを含む本番ログまで一致した。残るtraceは最後の集約処理だけだ。'
    }
    if (progress.clearedStageIds.includes(20)) {
      return 'BYTE // target候補の並び替えまで追えた。次は欠けたstatsがある経路を確認しよう。'
    }
    if (progress.clearedStageIds.includes(19)) {
      return 'BYTE // 二つのincident traceが同じ最深部へ収束した。残るtarget選択処理を追おう。'
    }
    if (progress.clearedStageIds.includes(18)) {
      return 'BYTE // 群れ全体で動くbarrierを読めた。Root Guardianがtraceのjunctionを塞いでいる。'
    }
    if (progress.clearedStageIds.includes(17)) {
      return 'BYTE // REAL WORLDのalarmとsome()のbooleanが一致した。次は群れ全体を見るbarrierだ。'
    }
    if (progress.clearedStageIds.includes(16)) {
      return 'BYTE // traceのdata形が変わる場所を追えた。この先は「一つでもあるか」だけをsignalにしている。'
    }
    if (progress.clearedStageIds.includes(15)) {
      return 'BYTE // 条件が変わってもfilter()のtraceを追えた。さらに西でdataの形が変わる。'
    }
    if (progress.clearedStageIds.includes(2)) {
      return 'BYTE // 二つ目の症状も同じcall pathへ入った。Deep Forestを西へ進み、root causeまで追おう。'
    }
    if (progress.clearedStageIds.includes(14)) {
      return 'BYTE // 複数targetへ広がる影響範囲がDeep Forestへ続いている。入口で二つ目の症状を確認しよう。'
    }
    if (progress.clearedStageIds.includes(13)) {
      return 'BYTE // 守り人の先でtraceが複数targetへ枝分かれした。影響範囲を全部追う必要がある。'
    }
    if (progress.clearedStageIds.includes(12)) {
      return 'BYTE // Forestの条件junctionを追えた。traceを塞ぐ守り人を越えよう。'
    }
    if (progress.clearedStageIds.includes(9)) {
      return 'BYTE // 最初のincidentで読みにくかったselectorを自分で追えるようになった。再戦せず、そのtraceを西のForestへ追おう。'
    }
    if (progress.clearedStageIds.includes(1)) {
      return 'BYTE // 最初のtarget異常は再現できた。原因を追う前に、HP・name・find()だけVillageで確認しよう。'
    }
    return 'LEAD ADA // 最初の仕事はtarget異常の調査。BYTEと合流したら、まず草原で実際の症状をその目で確かめよう。'
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
        detail: '開始地点の近くにいるBYTEへINTERACT。合流したら西の草原へ進み、Openingで見たtarget異常をまず再現する。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(1)) {
      return {
        label: 'LIVE INCIDENT',
        title: '草原で最初のtarget異常を実際に見る',
        detail: 'BYTEと西へ進もう。JavaScript側の草原へ入ると固定incidentが始まる。全部読めなくても、何が起きるかをまず観察する。',
        clear: false,
      }
    }
    if (nextTrainingBattleId !== null) {
      return {
        label: 'INCIDENT PREP',
        title: 'Villageで読めなかった部分だけ確認する',
        detail: 'VILLAGEへ入り、TRAINでHP・name・find()を順番に確認する。最初のincidentで分からなかったselectorを読めるようにするためだ。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(12)) {
      const traceStep = progress.clearedStageIds.includes(11)
        ? '条件が合流するjunction'
        : progress.clearedStageIds.includes(10)
          ? '別の入口から入る条件'
          : '二つの条件を両方通る枝'
      return {
        label: 'FOLLOW THE TRACE',
        title: `Forestで${traceStep}を追う`,
        detail: '最初の症状で見たselectorを読めるようになった。再戦ではなく、西のFORESTへ続くtraceを現在のstateとcodeから追おう。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(13)) {
      return {
        label: 'TRACE BLOCKED',
        title: 'Forestの守り人を突破する',
        detail: 'main trailを西へ進み、traceを塞ぐMID BOSSの隣でINTERACT。新しいsyntaxではなく、今までの条件だけで突破する。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(14)) {
      return {
        label: 'IMPACT RANGE',
        title: '複数targetへ広がった影響を全部追う',
        detail: '守り人の先のWoodsへ進もう。find()の最初の一体だけではなく、filter()で条件に合うもの全部を追う。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(2)) {
      return {
        label: 'SECOND SYMPTOM',
        title: 'Deep Forest入口で二つ目の異常を確認する',
        detail: 'Forest西端のEXITからDeep Forestへ入ろう。最初の移動で、複数targetへ広がった実際のincidentが再現される。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(15)) {
      return {
        label: 'FOLLOW SHARED TRACE',
        title: 'Deep Forestで共有経路を追い続ける',
        detail: '二つの症状は同じcall pathへ入った。Woodsへ進み、条件が変わったfilter()でも同じ処理を読み直そう。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(22)) {
      const nextTrace = !progress.clearedStageIds.includes(16)
        ? 'dataの形が変わる場所'
        : !progress.clearedStageIds.includes(17)
          ? 'alarmを動かすboolean'
          : !progress.clearedStageIds.includes(18)
            ? '群れ全体で動くbarrier'
            : !progress.clearedStageIds.includes(19)
              ? 'traceを塞ぐRoot Guardian'
              : !progress.clearedStageIds.includes(20)
                ? 'target候補の優先順'
                : !progress.clearedStageIds.includes(21)
                  ? '欠けたdataを含む経路'
                  : '最後に一つへ集約する処理'
      return {
        label: 'ROOT TRACE',
        title: `Deep Forestを西へ進み${nextTrace}を追う`,
        detail: '新しいsyntaxを覚えるためではなく、二つのincidentがどこへ集約されるかを現在のdata flowから追い続けよう。',
        clear: false,
      }
    }
    return {
      label: 'ROOT CAUSE',
      title: 'Deep Forest西口からCode Coreへ進む',
      detail: 'traceはCode Coreへ直結した。最深部の西側EXITからCore手前へ抜け、そのままBOSSの隣でINTERACTしよう。',
      clear: false,
    }
  }, [byteJoined, nextTrainingBattleId, progress.clearedAreaIds, progress.clearedStageIds])

  const villageObjective = useMemo(() => {
    if (nextTrainingBattleId === 7) {
      return {
        label: 'INCIDENT PREP · 1 / 3',
        title: '最初のBattleで見たHP条件を読む',
        detail: 'TRAINの隣でINTERACT。target条件に使われていたenemy.hpと< / >だけを小さく読む。',
        clear: false,
      }
    }
    if (nextTrainingBattleId === 8) {
      return {
        label: 'INCIDENT PREP · 2 / 3',
        title: '同じログにあったname条件を読む',
        detail: 'TRAINでもう一度INTERACT。enemy.nameと===を使って、文字の値を比較する。',
        clear: false,
      }
    }
    if (nextTrainingBattleId === 9) {
      return {
        label: 'INCIDENT PREP · 3 / 3',
        title: '最初のselectorがどこで止まったか読む',
        detail: 'enemiesを前から見て、find()が条件に合う最初の一体で止まる流れを確認する。',
        clear: false,
      }
    }
    return {
      label: 'TRACE READY',
      title: '最初のincidentの続きをForestへ追う',
      detail: '必要な読み方は揃った。同じBattleをやり直すのではなく、南のEXITから草原へ出て西のFORESTへ進み、selectorのtraceを追おう。',
      clear: true,
    }
  }, [nextTrainingBattleId])

  const forestObjective = useMemo(() => {
    if (!progress.clearedStageIds.includes(1)) {
      return {
        label: 'FOREST LOCKED',
        title: '先に草原の症状を実際に見る',
        detail: 'Forestへ進む前に、BYTEと最初のtarget異常を再現しよう。何が読めないかを知ることも調査の一部だ。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(9)) {
      return {
        label: 'FOREST LOCKED',
        title: 'Villageでselectorを読む材料を揃える',
        detail: '最初のincidentは再現済み。MIOとHP・name・find()だけ確認してから、同じtraceをForestへ追おう。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(10)) {
      return {
        label: 'FOLLOW TRACE · 1',
        title: '二つの条件を両方通る枝を追う',
        detail: 'Woodsへ入り、最初の症状から伸びたtraceが&&の左右をどう通るか読む。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(11)) {
      return {
        label: 'FOLLOW TRACE · 2',
        title: '別の入口から同じ処理へ入る条件を追う',
        detail: '西へ進み、||でどちらかの条件を通ったstateが同じ経路へ入ることを確認する。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(12)) {
      return {
        label: 'TRACE JUNCTION',
        title: '&&と||が合流する場所を読む',
        detail: '新しいsyntaxは増えない。かっこの内側から読み、複数条件がどのtargetを先へ送るか確定する。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(13)) {
      return {
        label: 'TRACE BLOCKED',
        title: 'traceを塞ぐ守り人を突破する',
        detail: 'main trailを西へ進みMID BOSSの隣でINTERACT。今まで読んだ条件だけで経路を開く。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(14)) {
      return {
        label: 'IMPACT RANGE',
        title: '複数targetへ広がる影響を全部追う',
        detail: '守り人の先のWoodsへ入り、find()の一体ではなくfilter()で条件に合うもの全部を追う。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(2)) {
      return {
        label: 'SECOND SYMPTOM AHEAD',
        title: '西端からDeep Forestへ進む',
        detail: '影響範囲のtraceがDeep Forestへ続いている。EXITを抜けると、二つ目の実際の症状を確認できる。',
        clear: false,
      }
    }
    return {
      label: 'FOREST TRACE COMPLETE',
      title: '二つの症状は同じDeep Forestへ続いた',
      detail: '調査は後戻りせず西へ続く。Deep Forestで共有経路をroot causeまで追おう。',
      clear: true,
    }
  }, [progress.clearedStageIds])

  const deepForestObjective = useMemo(() => {
    if (!progress.clearedStageIds.includes(2)) {
      return {
        label: 'SECOND SYMPTOM',
        title: '複数targetへ広がった実際の異常を再現する',
        detail: 'Deep Forestへ入った直後の最初の移動で固定incidentが始まる。Forestで読んだfilter() / && / ||を使って結果を追う。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(15)) {
      return {
        label: 'SHARED TRACE · FILTER',
        title: '条件が変わっても同じfilter()を追う',
        detail: 'Woods / Deep Woodsへ入り、hp > 65でも最後まで見て当てはまるもの全部を集める。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(16)) {
      return {
        label: 'TRACE TRANSFORMED',
        title: 'map()でdataの形が変わる場所を追う',
        detail: '西へ進み、各Enemyが新しいobjectへ変換された前後を対応させる。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(17)) {
      return {
        label: 'ALARM SIGNAL',
        title: 'some()で「一体でも」をbooleanにする',
        detail: 'alarmが誰を返すかではなく、条件に合うものが一つでもあるかというtrue / falseを先に決める。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(18)) {
      return {
        label: 'GROUP BARRIER',
        title: 'every()で群れ全体のstateを読む',
        detail: 'some()の「一つでも」とevery()の「全員」を区別し、barrierを動かすbooleanを追う。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(19)) {
      return {
        label: 'ROOT TRACE BLOCKED',
        title: 'Root Guardianのjunctionを突破する',
        detail: '西へ進むと二つのtraceを塞ぐ固定Battle。新しいsyntaxなしで、これまでのdata flowを読む。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(20)) {
      return {
        label: 'TARGET PRIORITY',
        title: 'sort()で候補の優先順を読む',
        detail: 'living → byHp → byHp[0]と途中結果へ分け、複数行codeでtargetが決まる順序を追う。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(21)) {
      return {
        label: 'MISSING DATA TRACE',
        title: '?. と ??で欠けたdataを含む経路を追う',
        detail: 'stats?.hpで安全に読み、値がない場合だけ??でInfinityを使う。production logの欠け方と照合する。',
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
      detail: 'traceはCode Coreへ直結した。Deep Forest西端のEXITを使えばCore手前へ出られる。来た道を戻る必要はない。',
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
    (battleId: number, battleRegion: 'javascript' | 'typescript', seed: string) => {
      gameAudio.playSe('confirm')
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
      if (shopOpen || innOpen || document.body.dataset.rpgPaused === 'true') return

      const result = resolveWorldMove({ rpgState, progress, dx, dy })
      if (result.kind === 'blocked') {
        gameAudio.playSe('cancel')
        setMessage(
          result.terrain === 'boss'
            ? '強い魔物が道を塞いでいる。隣からINTERACT。'
            : result.terrain === 'midboss'
              ? '森の守り人が道を塞いでいる。隣からINTERACT。'
              : result.terrain === 'recovery'
                ? 'INN。隣からINTERACTすると休める。'
                : result.terrain === 'treasure'
                  ? 'Treasure。隣からINTERACTして調べる。'
                  : result.terrain === 'house'
                    ? '家がある。今は中へは入れない。'
                    : result.terrain === 'training'
                      ? 'TRAIN。隣からINTERACTするとincident codeに必要な基礎を確認できる。'
                      : result.terrain === 'village'
                        ? !progress.clearedStageIds.includes(1)
                          ? 'Villageへ行く前に、BYTEと草原の最初のtarget異常を実際に見よう。'
                          : 'Villageへの道がまだ開いていない。'
                        : result.terrain === 'woods'
                          ? !progress.clearedStageIds.includes(1)
                            ? 'Forestへ進む前に、BYTEと草原で最初のtarget異常を実際に見よう。'
                            : !progress.clearedStageIds.includes(9)
                              ? 'Forestへ進む前に、Villageで最初のincidentに必要なHP・name・find()を確認しよう。'
                              : 'その先へ進むためのtraceがまだ開いていない。'
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
          result.label === 'CODE CORE APPROACH'
            ? 'Deep Forestのtraceを抜けてCode Core手前へ出た。北へ進めばFinal Bossだ。'
            : result.toMapId === JS_VILLAGE_MAP_ID
              ? `${result.label}へ入った。さっきのincidentで読めなかった部分だけMIOと確認しよう。`
              : result.toMapId === JS_DEEP_FOREST_MAP_ID
                ? progress.clearedStageIds.includes(2)
                  ? `${result.label}へ入った。共有traceはさらに西へ続いている。`
                  : `${result.label}へ入った。最初の移動で二つ目の実際の症状を確認する。`
                : result.toMapId === JS_FOREST_MAP_ID
                  ? `${result.label}へ入った。最初のincidentで見たselectorのtraceを西へ追おう。`
                  : `${result.label}へ移動した。`,
        )
        return
      }

      if (byteJoined) setFollowerPosition(position)
      setRpgState(result.nextState)
      if (result.kind === 'encounter') {
        setMessage('ENCOUNTER!')
        enterBattle(result.battle.battleId, result.battle.region, result.battle.seed)
        return
      }

      setMessage(terrainLabels[result.terrain] ?? result.terrain)
    },
    [byteJoined, enterBattle, innOpen, position, progress, rpgState, setRpgState, shopOpen],
  )

  const interact = useCallback(() => {
    if (shopOpen || innOpen || document.body.dataset.rpgPaused === 'true') return

    const intent = resolveWorldInteraction(rpgState, progress)

    if (intent.kind === 'training') {
      if (intent.battleId === null) {
        gameAudio.playSe('confirm')
        setMessage('TRAINER MIO: 必要な読み方は揃ったよ。同じBattleへ戻る必要はない。西のForestへ続くtraceを追ってみて。')
        return
      }
      enterBattle(intent.battleId, 'javascript', `village-training:${intent.battleId}`)
      return
    }

    if (intent.kind === 'midboss') {
      if (!intent.unlocked) {
        gameAudio.playSe('cancel')
        setMessage('BYTE: まずForestで条件のtraceを最後まで追おう。junctionまで読めれば、この守り人の先へ進める。')
        return
      }
      enterBattle(intent.battleId, intent.region, intent.seed)
      return
    }

    if (intent.kind === 'party') {
      if (intent.alreadyJoined) {
        if (!progress.clearedStageIds.includes(1)) {
          setMessage('BYTE: まず現場を見よう。西の草原へ進めば、Openingで見たtarget異常を実際のstateで確認できる。')
        } else if (nextTrainingBattleId !== null) {
          setMessage('BYTE: 症状は再現できた。MIOにログを見せて、読めなかったHP・name・find()だけ確認しよう。')
        } else if (!progress.clearedStageIds.includes(12)) {
          setMessage('BYTE: 最初の症状で見たselectorを今なら読める。traceはForestへ続いてるから、条件を一つずつ追おう。')
        } else if (!progress.clearedStageIds.includes(13)) {
          setMessage('BYTE: traceが森の守り人の向こうへ集まってる。今まで読んだ条件だけで道を開こう。')
        } else if (!progress.clearedStageIds.includes(14)) {
          setMessage('BYTE: 守り人の先で影響が複数targetへ広がってる。filter()で全部のtraceを追おう。')
        } else if (!progress.clearedStageIds.includes(2)) {
          setMessage('BYTE: 影響範囲はDeep Forestへ続いてる。西端のEXITから入り、二つ目の実際の症状を確認しよう。')
        } else if (!progress.clearedStageIds.includes(15)) {
          setMessage('BYTE: 二つの症状は同じ経路へ入った。Deep Forestを西へ進み、条件が変わってもtraceを追おう。')
        } else if (!progress.clearedStageIds.includes(16)) {
          setMessage('BYTE: この先でtraceのdata形が変わる。map()の前後を対応させよう。')
        } else if (!progress.clearedStageIds.includes(17)) {
          setMessage('BYTE: 次はalarm signal。一体でも条件に合うかというbooleanを追う。')
        } else if (!progress.clearedStageIds.includes(18)) {
          setMessage('BYTE: 次のbarrierは群れ全体を見る。every()で「全員」を確かめよう。')
        } else if (!progress.clearedStageIds.includes(19)) {
          setMessage('BYTE: Root Guardianが二つのtraceのjunctionを塞いでる。新しいsyntaxはない。')
        } else if (!progress.clearedStageIds.includes(20)) {
          setMessage('BYTE: 最深部ではtarget候補を並べ替えてる。living → byHp → [0]の順で追おう。')
        } else if (!progress.clearedStageIds.includes(21)) {
          setMessage('BYTE: productionと同じくstatsが欠けたrecordがある。?.と??で経路を追おう。')
        } else if (!progress.clearedStageIds.includes(22)) {
          setMessage('BYTE: 残るtraceは最後の集約だけ。reduce()でbestに何が残るか追おう。')
        } else if (!progress.clearedAreaIds.includes('javascript')) {
          setMessage('BYTE: root causeはCode Coreで確定した。Deep Forest西口からCore手前へ直進できる。')
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
      setMessage('BYTE joined the party! まず西の草原で、Openingのtarget異常を一緒に見に行こう。')
      return
    }

    if (intent.kind === 'shop') {
      gameAudio.playSe('confirm')
      setShopOpen(true)
      setMessage('SHOP: Item / Equipmentを選んで購入できる。')
      return
    }

    if (intent.kind === 'recovery') {
      gameAudio.playSe('confirm')
      setInnOpen(true)
      setMessage('INN: Goldを払ってHPを全回復できる。')
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
      setMessage(`${result.definition.name} OPEN → ${rewards.join(' / ')}`)
      return
    }

    if (intent.kind === 'boss') {
      if (!intent.unlocked) {
        setMessage(
          intent.region === 'javascript'
            ? !progress.clearedStageIds.includes(1)
              ? 'BYTEと最初のtarget異常を実際に見て、何を読む必要があるか掴もう。'
              : !progress.clearedStageIds.includes(9)
                ? 'Villageで最初のincidentに必要なHP・name・find()を確認しよう。'
                : !progress.clearedStageIds.includes(2)
                  ? 'Forestの影響範囲を追い、Deep Forest入口で二つ目の症状を確認しよう。'
                  : 'Code Coreへ挑む前に、Deep Forestのtraceをroot causeまで最後まで追おう。'
            : '東の奥へ進む前に、TypeScript地方のBattleをもう少し確かめよう。',
        )
        return
      }
      enterBattle(intent.battleId, intent.region, intent.seed)
      return
    }

    setMessage(
      isVillage
        ? nextTrainingBattleId === null
          ? '必要な確認は終わった。南のEXITから草原へ出て、西のForestへ同じtraceを追おう。'
          : '最初のincidentで読めなかった部分を、中央のTRAINでMIOと一つずつ確認しよう。'
        : isDeepForest
          ? progress.clearedStageIds.includes(22)
            ? 'root causeはCode Core。Deep Forest西端のEXITからCore手前へ直進できる。'
            : !progress.clearedStageIds.includes(2)
              ? 'Deep Forestへ入った。次の一歩で二つ目の実際の症状を確認する。'
              : 'main trailを西へ進み、Woods / Deep Woodsで共有traceを追おう。Randomはclear済み内容だけだ。'
          : isForest
            ? progress.clearedStageIds.includes(14)
              ? '影響範囲は西端のEXITからDeep Forestへ続いている。このまま先へ進もう。'
              : progress.clearedStageIds.includes(13)
                ? '守り人の先でtraceが複数targetへ広がっている。西側のWoodsへ進もう。'
                : '木々の間にincidentのtraceが続いている。Woodsとmain trailを西へ追おう。'
            : '近くに調べられるものはない。',
    )
  }, [
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

  useWorldKeyboardControls({ interact, move, disabled: shopOpen || innOpen })

  return (
    <main className="app-shell world-shell title-screen">
      <section className="pixel-window world-panel">
        <header className="world-header">
          <div>
            <div className="eyebrow">
              {isLocalMap ? 'LOCAL MAP' : 'OPEN WORLD'} //{' '}
              {isLocalMap ? getWorldMapLabel(mapId) : regionLabels[region]}
            </div>
            <h1>
              {isVillage
                ? 'GREENFIELD VILLAGE'
                : isDeepForest
                  ? 'JAVASCRIPT DEEP FOREST'
                  : isForest
                    ? 'JAVASCRIPT FOREST'
                    : 'CODE WORLD'}
            </h1>
            <p>
              {isVillage
                ? '最初のtarget異常で読めなかった部分だけをMIOと確認する村。HP・name・find()が読めたら、同じtraceをForestへ追う。'
                : isDeepForest
                  ? '二つのtarget異常が合流した深い森。dataの変換・判定・優先順・集約を追い、最深部の西口からCode Coreへつながる。'
                  : isForest
                    ? '最初のtarget異常から伸びるtraceを追う森。条件の分岐から複数targetへの影響拡大までを調べる。'
                    : region === 'javascript'
                      ? javascriptStoryBrief
                      : region === 'typescript'
                        ? '東側はTypeScript地方。西とは違うruleを読みながら進む。'
                        : '中央のHubから、西のJavaScript地方と東のTypeScript地方へ進める。'}
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
              ? 'Village map'
              : isDeepForest
                ? 'Deep Forest map'
                : isForest
                  ? 'Forest map'
                  : 'Open world map'
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
                  <span className="world-object boss-object">BOSS</span>
                )}
                {renderedTerrain === 'midboss' && (
                  <span
                    className="world-object midboss-object"
                    aria-label="JavaScript Forest Mid-Boss"
                  >
                    MID BOSS
                  </span>
                )}
                {renderedTerrain === 'shop' && (
                  <span className="world-object shop-object">SHOP</span>
                )}
                {renderedTerrain === 'village' && (
                  <span className="world-object village-object">VILLAGE</span>
                )}
                {renderedTerrain === 'exit' && (
                  <span className="world-object exit-object">EXIT</span>
                )}
                {renderedTerrain === 'training' && (
                  <span
                    className="world-object training-object"
                    aria-label="JavaScript Training Ground"
                  >
                    TRAIN
                  </span>
                )}
                {renderedTerrain === 'npc' && !byteJoined && (
                  <span className="world-object npc-object" aria-label="BYTE NPC">
                    <img src={characterVisuals.byte.field} alt="" />
                  </span>
                )}
                {renderedTerrain === 'recovery' && (
                  <span className="world-object recovery-object" aria-label="Inn / Rest">
                    INN
                  </span>
                )}
                {treasure && (
                  <span
                    className={`world-object treasure-object ${treasureOpened ? 'opened' : ''}`}
                    aria-label={`${treasure.id} treasure ${treasureOpened ? 'opened' : 'closed'}`}
                  >
                    {treasureOpened ? 'OPEN' : 'CHEST'}
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
          <span>FIELD LOG</span>
          <p>{message}</p>
        </section>

        <WorldControls move={move} interact={interact} />
      </section>

      <WorldShop open={shopOpen} onClose={() => setShopOpen(false)} onMessage={setMessage} />
      <WorldInn open={innOpen} onClose={() => setInnOpen(false)} onMessage={setMessage} />
    </main>
  )
}

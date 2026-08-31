import { useCallback, useEffect, useMemo, useState } from 'react'
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
      if (progress.clearedStageIds.includes(2)) {
        return 'BYTE // 二つの異変が同じCode Coreへつながった。北西のFinal Bossを止めればJavaScript地方を復旧できる。'
      }
      if (progress.clearedStageIds.includes(1)) {
        return 'BYTE // 一つ目の異変を確認した。同じ症状が残る草原でもう一戦、実際のcodeを追おう。'
      }
      return 'BYTE // Deep Forestの学習は完了。草原へ戻り、最初に起きていたtarget異変を実際のBattleで追おう。'
    }
    if (progress.clearedStageIds.includes(21)) {
      return 'BYTE // ?. と ??まで読めた。Deep Forest最深部でreduce()を一行ずつ追おう。'
    }
    if (progress.clearedStageIds.includes(20)) {
      return 'BYTE // sort()と[0]を読めた。次は値がない場合にも安全に読む?. と ??だ。'
    }
    if (progress.clearedStageIds.includes(19)) {
      return 'BYTE // 第二の守り人を突破した。最深部でsort()から複数行codeの読み方を広げよう。'
    }
    if (progress.clearedStageIds.includes(18)) {
      return 'BYTE // some()とevery()を区別できた。Deep Forestの第二の守り人へ既習内容だけで挑もう。'
    }
    if (progress.clearedStageIds.includes(17)) {
      return 'BYTE // some()は「一つでも」をbooleanで返す。次はevery()の「全員」を比べよう。'
    }
    if (progress.clearedStageIds.includes(16)) {
      return 'BYTE // map()で各要素を変換する流れを読めた。次はsome()でtrue / falseを調べる。'
    }
    if (progress.clearedStageIds.includes(15)) {
      return 'BYTE // filter()を条件違いでも読めた。Deep Forestを西へ進み、次はmap()で各要素を変換しよう。'
    }
    if (progress.clearedStageIds.includes(14)) {
      return 'BYTE // filter()の基本は読めた。Forest西端からDeep Forestへ進んで、別の条件でも同じ読み方を試そう。'
    }
    if (progress.clearedStageIds.includes(13)) {
      return 'BYTE // 森の守り人を突破した。次は「条件に合うものをまとめて集める」動きを読んでみよう。'
    }
    if (progress.clearedStageIds.includes(12)) {
      return 'BYTE // &&と||までは読めた。森の西側で道を塞ぐ守り人に、今までの読み方だけで挑んでみよう。'
    }
    if (progress.clearedStageIds.includes(9)) {
      return 'BYTE // 村の基礎訓練は完了。西の森では、条件が二つに増えたruleを読んでみよう。'
    }
    return 'LEAD ADA // 西の草原で、技が違う魔物へ飛ぶことがある。まず村と森で、コードを小さいところから読む練習をしよう。'
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
        label: 'NEXT OBJECTIVE · 1 / 4',
        title: 'BYTEと合流する',
        detail:
          '開始地点から左か上へ1歩進むとBYTEの隣。INTERACTで話しかけ、仲間になったら西へ向かおう。',
        clear: false,
      }
    }
    if (nextTrainingBattleId !== null) {
      return {
        label: 'NEXT OBJECTIVE · TRAINING',
        title: '西の村でJavaScriptの読み方を練習する',
        detail:
          'Hubから西の道を進み、途中で北へ伸びる道の先にあるVILLAGEへ入ろう。村のTRAINで基礎を順番に練習できる。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(12)) {
      const forestStep = progress.clearedStageIds.includes(11)
        ? '&&と||を一緒に読む'
        : progress.clearedStageIds.includes(10)
          ? '||を読む'
          : '&&を読む'
      return {
        label: 'NEXT OBJECTIVE · FOREST',
        title: `西の森で${forestStep}`,
        detail:
          '村を出て西の道を進み、FORESTへ入ろう。森の道を外れて歩くと、学んだ範囲だけのBattleが起こる。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(13)) {
      return {
        label: 'NEXT OBJECTIVE · MID-BOSS',
        title: '森の守り人を突破する',
        detail:
          'FORESTのmain trailを西へ進もう。MID BOSSの隣でINTERACTし、今まで学んだ条件だけでBattle 13を読み切る。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(14)) {
      return {
        label: 'NEXT OBJECTIVE · FILTER',
        title: '最初の一体ではなく、全部集める読み方を知る',
        detail:
          '守り人を越えてForest西側へ進み、main trailからWoodsへ入ろう。Battle 14でfind()とfilter()の違いを読む。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(15)) {
      return {
        label: 'NEXT OBJECTIVE · DEEP FOREST',
        title: 'Deep Forestでfilter()をもう一度読む',
        detail:
          'Forestの西端にあるEXITからDEEP FORESTへ入ろう。最初のWoodsで、今度はhp > 65のfilter()を読む。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(22)) {
      const nextLesson = !progress.clearedStageIds.includes(16)
        ? 'map()'
        : !progress.clearedStageIds.includes(17)
          ? 'some()'
          : !progress.clearedStageIds.includes(18)
            ? 'every()'
            : !progress.clearedStageIds.includes(19)
              ? '第二MID BOSS'
              : !progress.clearedStageIds.includes(20)
                ? 'sort()'
                : !progress.clearedStageIds.includes(21)
                  ? '?. / ??'
                  : 'reduce()'
      return {
        label: 'NEXT OBJECTIVE · DEEP FOREST',
        title: `Deep Forestを西へ進み${nextLesson}を読む`,
        detail:
          'Forest西端のEXITからDeep Forestへ戻り、西へ進もう。新conceptは固定Lessonで先に学び、Woodsではclear済み内容だけを復習できる。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(1)) {
      return {
        label: 'FINAL INCIDENT · 1 / 2',
        title: '草原へ戻って最初の異変を追う',
        detail:
          'Deep Forestの学習は完了。Forest東端からOverworldへ戻り、JavaScript側の草むらで実際のtarget異変を調べよう。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(2)) {
      return {
        label: 'FINAL INCIDENT · 2 / 2',
        title: 'もう一つの異変を追う',
        detail:
          '一つ目の異変は確認できた。JavaScript側の草むらでもう一戦し、共通するCode Coreへのつながりを確かめよう。',
        clear: false,
      }
    }
    return {
      label: 'FINAL BOSS',
      title: '北西のCode Coreへ向かう',
      detail:
        '二つの異変が同じroot causeへつながった。北西のBOSSの隣でINTERACTし、JavaScript Final Boss Battle 3へ挑もう。',
      clear: false,
    }
  }, [byteJoined, nextTrainingBattleId, progress.clearedAreaIds, progress.clearedStageIds])

  const villageObjective = useMemo(() => {
    if (nextTrainingBattleId === 7) {
      return {
        label: 'TRAINING · 1 / 3',
        title: 'HPの数字を見比べる',
        detail: '村の中央にあるTRAINの隣でINTERACT。まず enemy.hp と < / > の読み方を練習する。',
        clear: false,
      }
    }
    if (nextTrainingBattleId === 8) {
      return {
        label: 'TRAINING · 2 / 3',
        title: '名前を見比べる',
        detail: 'TRAINでもう一度INTERACT。enemy.name と === を使って、文字の値を比べる。',
        clear: false,
      }
    }
    if (nextTrainingBattleId === 9) {
      return {
        label: 'TRAINING · 3 / 3',
        title: 'find()を前から追う',
        detail: '最後の基礎訓練。enemiesを前から見て、条件に合う最初の一体で止まる流れを読む。',
        clear: false,
      }
    }
    return {
      label: 'TRAINING COMPLETE',
      title: '村の基礎訓練を完了した',
      detail:
        '南のEXITから草原へ戻り、西の道を進もう。FORESTでは&&と||を、今までのfind()に足して読む。',
      clear: true,
    }
  }, [nextTrainingBattleId])

  const forestObjective = useMemo(() => {
    if (!progress.clearedStageIds.includes(10)) {
      return {
        label: 'FOREST · 1 / 4',
        title: '&& — 二つともtrueを読む',
        detail: '道を外れてWoodsを歩こう。最初のEncounterでは、find()の条件に&&が加わる。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(11)) {
      return {
        label: 'FOREST · 2 / 4',
        title: '|| — どちらかtrueを読む',
        detail: 'Woodsを歩いてEncounterを続けよう。&&を反復しながら、次は||の違いを読む。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(12)) {
      return {
        label: 'FOREST · 3 / 4',
        title: '&&と||を小さく分けて読む',
        detail:
          '新しいsyntaxは増えない。かっこの内側から順に読み、find()が最初に止まる相手を追おう。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(13)) {
      return {
        label: 'FOREST MID-BOSS',
        title: '今までの読み方だけで守り人へ挑む',
        detail:
          'main trailを西へ進み、MID BOSSの隣でINTERACT。新しいsyntaxは使わず、Battle 13で理解を確認する。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(14)) {
      return {
        label: 'FOREST · 4 / 4',
        title: 'find()とfilter()の違いを読む',
        detail:
          '守り人の先へ進み、西側のWoodsへ入ろう。同じhp < 45でも、一体で止まるか全部集めるかを比べる。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(22)) {
      return {
        label: 'DEEP FOREST ROUTE',
        title: '西端のEXITからDeep Forestへ進む',
        detail:
          'Forest側の学習は完了。西端のEXITからDeep Forestへ入り、map()以降の学習routeを最後まで進めよう。',
        clear: false,
      }
    }
    return {
      label: 'FOREST ROUTE COMPLETE',
      title: 'Deep Forestの学習まで完了した',
      detail: '東のEXITからOverworldへ戻り、草原で残っている実際の異変を追おう。',
      clear: true,
    }
  }, [progress.clearedStageIds])

  const deepForestObjective = useMemo(() => {
    if (!progress.clearedStageIds.includes(15)) {
      return {
        label: 'DEEP FOREST · 1 / 8',
        title: 'filter()を反対向きの条件でも読む',
        detail:
          'main trailを外れてWoods / Deep Woodsへ入ろう。最初のLessonでhp > 65を最後まで見て、当てはまるもの全部を集める。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(16)) {
      return {
        label: 'DEEP FOREST · 2 / 8',
        title: 'map()で一つずつ別の形へ変える',
        detail:
          '西へ進みWoods / Deep Woodsへ入ろう。各Enemyを新しいobjectへ変換してから、既習のfind()へ戻る流れを読む。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(17)) {
      return {
        label: 'DEEP FOREST · 3 / 8',
        title: 'some()で「一体でも」をtrue / falseにする',
        detail: 'さらに西へ進もう。some()の結果を先にbooleanとして決め、その値を外側の処理へ戻す。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(18)) {
      return {
        label: 'DEEP FOREST · 4 / 8',
        title: 'every()で「全員」をtrue / falseにする',
        detail: 'some()の「一体でも」とevery()の「全員」を比べる。内側のbooleanから順番に読む。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(19)) {
      return {
        label: 'DEEP FOREST · 5 / 8 · MID-BOSS',
        title: '第二の守り人を既習内容だけで突破する',
        detail:
          '西へ進むとRoot Guardianとの固定Battle 19。filter() / map() / some() / every()だけで理解を確認する。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(20)) {
      return {
        label: 'DEEP FOREST · 6 / 8',
        title: 'sort()で並べ替え、[0]で先頭を取る',
        detail:
          '最深部へ進もう。living → byHp → byHp[0]と途中結果へ分け、複数行codeを一行ずつ追う。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(21)) {
      return {
        label: 'DEEP FOREST · 7 / 8',
        title: '?. と ??で安全に値を読む',
        detail:
          'livingをmap()でnestedなwrappedへ変換し、stats?.hpで安全に読み、??で欠けた値だけInfinityへ置き換える。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(22)) {
      return {
        label: 'DEEP FOREST · 8 / 8',
        title: 'reduce()で最後に一つへまとめる',
        detail: 'bestと次のEnemyを一体ずつ比べ、途中結果を更新しながら最後まで進むreduce()を読む。',
        clear: false,
      }
    }
    return {
      label: 'DEEP FOREST COMPLETE',
      title: 'JavaScriptの学習routeを最後まで読み切った',
      detail:
        '東へ戻ってForestを抜け、Overworldの草原へ戻ろう。残る二つの実際の異変を追った先にFinal Bossがいる。',
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

  useEffect(() => {
    const rewards: string[] = []
    if (progress.clearedAreaIds.includes('javascript')) rewards.push('branch-saber')
    if (progress.clearedAreaIds.includes('typescript')) rewards.push('typed-mail')
    if (rewards.length === 0) return

    setRpgState((current) => {
      const missing = rewards.filter((id) => !current.ownedEquipmentIds.includes(id))
      if (missing.length === 0) return current
      return { ...current, ownedEquipmentIds: [...current.ownedEquipmentIds, ...missing] }
    })
  }, [progress.clearedAreaIds, setRpgState])

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
                      ? 'TRAIN。隣からINTERACTするとJavaScriptの基礎訓練を始められる。'
                      : result.terrain === 'woods'
                        ? '森へ進む前に、GREENFIELD VILLAGEのTRAINを3つ終わらせよう。'
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
          result.toMapId === JS_VILLAGE_MAP_ID
            ? `${result.label}へ入った。中央のTRAINでJavaScriptの基礎を練習できる。`
            : result.toMapId === JS_DEEP_FOREST_MAP_ID
              ? `${result.label}へ入った。西へ進むほど新しい固定Lessonが続き、Woodsではclear済み内容だけを復習できる。`
              : result.toMapId === JS_FOREST_MAP_ID
                ? `${result.label}へ入った。道を外れてWoodsを歩くと、学習済み範囲のBattleが起こる。`
                : `${result.label}へ戻った。西へ進むほど森が深くなっていく。`,
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
        setMessage('TRAINER MIO: 基礎訓練は全部クリア。草原へ戻って、西のFORESTへ進んでみよう。')
        return
      }
      enterBattle(intent.battleId, 'javascript', `village-training:${intent.battleId}`)
      return
    }

    if (intent.kind === 'midboss') {
      if (!intent.unlocked) {
        gameAudio.playSe('cancel')
        setMessage(
          'BYTE: まず森のLesson 10〜12を終わらせよう。今までの読み方が揃えば、この守り人にも挑める。',
        )
        return
      }
      enterBattle(intent.battleId, intent.region, intent.seed)
      return
    }

    if (intent.kind === 'party') {
      if (intent.alreadyJoined) {
        if (nextTrainingBattleId !== null) {
          setMessage(
            'BYTE: まずGREENFIELD VILLAGEのTRAINで、コードを小さいところから読んでみよう。',
          )
        } else if (!progress.clearedStageIds.includes(12)) {
          setMessage('BYTE: 次は西のFOREST。&&と||も、小さな条件へ分ければ読めるよ。')
        } else if (!progress.clearedStageIds.includes(13)) {
          setMessage(
            'BYTE: 森の西側に守り人がいる。新しい記号はないから、今までの読み方だけで挑もう。',
          )
        } else if (!progress.clearedStageIds.includes(14)) {
          setMessage(
            'BYTE: 守り人の先のWoodsへ行こう。次はfind()の「最初の一体」と、filter()の「全部集める」を比べる。',
          )
        } else if (!progress.clearedStageIds.includes(15)) {
          setMessage(
            'BYTE: Forest西端のEXITからDeep Forestへ進もう。filter()を別の条件でもう一度読んでみる。',
          )
        } else if (!progress.clearedStageIds.includes(16)) {
          setMessage(
            'BYTE: Deep Forestを西へ。次はmap()で各Enemyを一つずつ別の形へ変える流れを読む。',
          )
        } else if (!progress.clearedStageIds.includes(17)) {
          setMessage(
            'BYTE: map()は読めた。さらに西でsome()の「一つでも」をtrue / falseとして確かめよう。',
          )
        } else if (!progress.clearedStageIds.includes(18)) {
          setMessage('BYTE: 次はevery()。「一つでも」ではなく「全員」が条件に合うかを読む。')
        } else if (!progress.clearedStageIds.includes(19)) {
          setMessage(
            'BYTE: Deep Forestの第二の守り人へ。新しいsyntaxはないから、既習内容だけで挑もう。',
          )
        } else if (!progress.clearedStageIds.includes(20)) {
          setMessage(
            'BYTE: 最深部でsort()を読む。living → byHp → byHp[0]と途中結果へ分ければ大丈夫。',
          )
        } else if (!progress.clearedStageIds.includes(21)) {
          setMessage(
            'BYTE: sort()の次は?.と??。map()で作ったnestedなstats.hpを安全に読む部分だけを足そう。',
          )
        } else if (!progress.clearedStageIds.includes(22)) {
          setMessage(
            'BYTE: Deep Forest最後のLessonはreduce()。bestへ途中結果を一つずつ残して読む。',
          )
        } else if (!progress.clearedStageIds.includes(1)) {
          setMessage(
            'BYTE: 学習routeは完了。草原へ戻って、最初に起きていた実際のtarget異変を追おう。',
          )
        } else if (!progress.clearedStageIds.includes(2)) {
          setMessage('BYTE: 一つ目の異変は確認した。同じ症状が残る草原でもう一戦追おう。')
        } else if (!progress.clearedAreaIds.includes('javascript')) {
          setMessage(
            'BYTE: 二つの異変がCode Coreへつながった。北西のBOSSがJavaScript地方のFinal Bossだ。',
          )
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
      setMessage('BYTE joined the party! Battleでは、同じ相手へ追撃してくれる。')
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
            ? !progress.clearedStageIds.includes(22)
              ? 'Code Coreへ挑む前に、Deep ForestのLesson 15〜22を最後まで読み切ろう。'
              : 'Code Coreへ入る前に、草原に残る二つのtarget異変をBattle 1 / 2で確認しよう。'
            : '東の奥へ進む前に、TypeScript地方のBattleをもう少し確かめよう。',
        )
        return
      }
      enterBattle(intent.battleId, intent.region, intent.seed)
      return
    }

    setMessage(
      isVillage
        ? '静かな村だ。中央のTRAINか、南のEXITを調べてみよう。'
        : isDeepForest
          ? progress.clearedStageIds.includes(22)
            ? 'Deep Forestの学習は完了。東へ戻り、Overworldの草原で残る異変を追おう。'
            : progress.clearedStageIds.includes(15)
              ? 'main trailを西へ進み、Woods / Deep Woodsへ入ると次の固定Lessonが始まる。Randomはclear済み内容だけだ。'
              : '道を外れてWoodsへ入ろう。最初のLessonでfilter()を別条件でもう一度読む。'
          : isForest
            ? progress.clearedStageIds.includes(14)
              ? '西端のEXITからDeep Forestへ進める。ForestのWoodsではfilter()も復習できる。'
              : progress.clearedStageIds.includes(13)
                ? '守り人の先へ進める。西側のWoodsで、次の読み方を確かめよう。'
                : '木々の間に道が続いている。Woodsでは復習Battle、main trailの西側には守り人がいる。'
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
                ? 'JavaScript地方の小さな村。中央のTRAINでコードの読み方を練習し、南の出口から草原へ戻れる。'
                : isDeepForest
                  ? 'JavaScript地方の深い森。filter()からmap() / some() / every()、最深部のsort() / ?. / ?? / reduce()まで固定Lessonで順番に読む。東のEXITからForestへ戻れる。'
                  : isForest
                    ? 'JavaScript地方の森。東側で&& / ||を読み、守り人の先ではfind()とfilter()の違いを学ぶ。'
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

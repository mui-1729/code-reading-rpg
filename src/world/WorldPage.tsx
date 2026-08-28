import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { gameAudio } from '../audio/gameAudio'
import { useBgm } from '../audio/useBgm'
import { WorldInn, WorldShop } from '../economy'
import { useProgress } from '../progression'
import {
  characterVisuals,
  emptyPartyEquipment,
  equipmentById,
  useRpg,
} from '../rpg'
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

const VIEWPORT_COLUMNS = 11
const VIEWPORT_ROWS = 9

type Position = { x: number; y: number }

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
  const [followerPosition, setFollowerPosition] = useState<Position>(() => ({
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
    if (progress.clearedStageIds.includes(15)) {
      return 'BYTE // filter()は条件が変わっても、当てはまるものを最後まで見て全部集めると確認できた。'
    }
    if (progress.clearedStageIds.includes(14)) {
      return 'BYTE // filter()の基本は読めた。さらに深い森で、条件の向きが変わっても同じ読み方ができるか確かめよう。'
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
    if (progress.clearedStageIds.includes(2)) {
      return 'BYTE // おかしな動きの原因は、もっと西の奥にあるみたいだ。Code Coreまで確かめに行こう。'
    }
    if (progress.clearedStageIds.includes(1)) {
      return 'BYTE // 別の技でも同じようなズレが起きている。どの敵を選ぶruleなのか、もう少し見てみよう。'
    }
    return 'LEAD ADA // 西の草原で、技が違う魔物へ飛ぶことがある。まず何を見て相手を選んでいるか確かめよう。'
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
        detail: '開始地点から左か上へ1歩進むとBYTEの隣。INTERACTで話しかけ、仲間になったら西へ向かおう。',
        clear: false,
      }
    }
    if (nextTrainingBattleId !== null) {
      return {
        label: 'NEXT OBJECTIVE · TRAINING',
        title: '西の村でJavaScriptの読み方を練習する',
        detail: 'Hubから西の道を進み、途中で北へ伸びる道の先にあるVILLAGEへ入ろう。村のTRAINで基礎を順番に練習できる。',
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
        detail: '村を出て西の道を進み、FORESTへ入ろう。森の道を外れて歩くと、学んだ範囲だけのBattleが起こる。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(13)) {
      return {
        label: 'NEXT OBJECTIVE · MID-BOSS',
        title: '森の守り人を突破する',
        detail: 'FORESTのmain trailを西へ進もう。MID BOSSの隣でINTERACTし、今まで学んだ条件だけでBattle 13を読み切る。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(14)) {
      return {
        label: 'NEXT OBJECTIVE · FILTER',
        title: '最初の一体ではなく、全部集める読み方を知る',
        detail: '守り人を越えてForest西側へ進み、main trailからWoodsへ入ろう。Battle 14でfind()とfilter()の違いを読む。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(15)) {
      return {
        label: 'NEXT OBJECTIVE · DEEP FOREST',
        title: 'filter()を別の条件でも読む',
        detail: 'Forestのmain trailをさらに西へ進み、端のEXITからDEEP FORESTへ入ろう。Deep WoodsでBattle 15を固定Lessonとして読む。',
        clear: false,
      }
    }
    if (progress.clearedStageIds.includes(2)) {
      return {
        label: 'NEXT OBJECTIVE · 4 / 4',
        title: '西の最深部へ向かう',
        detail: '北西の道を進み、BOSSの隣でINTERACT。異変の原因を確かめよう。',
        clear: false,
      }
    }
    if (progress.clearedStageIds.includes(1)) {
      return {
        label: 'NEXT OBJECTIVE · 3 / 4',
        title: '西でもう少し戦って確かめる',
        detail: '草むらを歩き、別のBattleでも「どの敵が選ばれるか」を読んでみよう。',
        clear: false,
      }
    }
    return {
      label: 'NEXT OBJECTIVE · 2 / 4',
      title: '草原の異変を調べる',
      detail: 'Deep Forestでfilter()の条件違いまで確認した。Overworldの草むらへ戻り、main Battleで実際の異変を追おう。',
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
      detail: '南のEXITから草原へ戻り、西の道を進もう。FORESTでは&&と||を、今までのfind()に足して読む。',
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
        detail: '新しいsyntaxは増えない。かっこの内側から順に読み、find()が最初に止まる相手を追おう。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(13)) {
      return {
        label: 'FOREST MID-BOSS',
        title: '今までの読み方だけで守り人へ挑む',
        detail: 'main trailを西へ進み、MID BOSSの隣でINTERACT。新しいsyntaxは使わず、Battle 13で理解を確認する。',
        clear: false,
      }
    }
    if (!progress.clearedStageIds.includes(14)) {
      return {
        label: 'FOREST · 4 / 4',
        title: 'find()とfilter()の違いを読む',
        detail: '守り人の先へ進み、西側のWoodsへ入ろう。同じhp < 45でも、一体で止まるか全部集めるかを比べる。',
        clear: false,
      }
    }
    return {
      label: 'FOREST COMPLETE',
      title: 'Deep Forestへの道が開いた',
      detail: 'main trailを西端まで進み、EXITからDEEP FORESTへ入ろう。次はfilter()を別条件で反復する。',
      clear: true,
    }
  }, [progress.clearedStageIds])

  const deepForestObjective = useMemo(() => {
    if (!progress.clearedStageIds.includes(15)) {
      return {
        label: 'DEEP FOREST · 1 / 1',
        title: 'filter()の条件だけを変えて読む',
        detail: '入口の道からDeep Woodsへ踏み込もう。Battle 15ではfilter()の意味を保ったまま、hp > 65を読む。',
        clear: false,
      }
    }
    return {
      label: 'FILTER REPEATED',
      title: 'filter()を条件違いでも読めた',
      detail: 'Deep WoodsではBattle 14 / 15を反復できる。次は集めたものを別の形へ変える読み方へ進む準備ができた。',
      clear: true,
    }
  }, [progress.clearedStageIds])

  const currentObjective = isVillage
    ? villageObjective
    : isForest
      ? forestObjective
      : isDeepForest
        ? deepForestObjective
        : javascriptNextObjective

  const spriteStyle = useCallback(
    (spritePosition: Position) => ({
      left: `${((spritePosition.x - viewportStart.x + 0.5) / VIEWPORT_COLUMNS) * 100}%`,
      top: `${((spritePosition.y - viewportStart.y + 0.5) / VIEWPORT_ROWS) * 100}%`,
    }),
    [viewportStart.x, viewportStart.y],
  )

  const followerVisible =
    byteJoined &&
    followerPosition.x >= viewportStart.x &&
    followerPosition.x < viewportStart.x + VIEWPORT_COLUMNS &&
    followerPosition.y >= viewportStart.y &&
    followerPosition.y < viewportStart.y + VIEWPORT_ROWS

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
                      : result.terrain === 'exit' && isForest && !progress.clearedStageIds.includes(14)
                        ? 'Deep Forestへ進む前に、Forest西側のBattle 14でfilter()の基本を読もう。'
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
            : result.toMapId === JS_FOREST_MAP_ID
              ? `${result.label}へ入った。道を外れてWoodsを歩くと、学習済み範囲のBattleが起こる。`
              : result.toMapId === JS_DEEP_FOREST_MAP_ID
                ? `${result.label}へ入った。道を外れてDeep Woodsへ踏み込むと、filter()の次の固定Lessonが始まる。`
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
    [
      byteJoined,
      enterBattle,
      innOpen,
      isForest,
      position,
      progress,
      rpgState,
      setRpgState,
      shopOpen,
    ],
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
        setMessage('BYTE: まず森のLesson 10〜12を終わらせよう。今までの読み方が揃えば、この守り人にも挑める。')
        return
      }
      enterBattle(intent.battleId, intent.region, intent.seed)
      return
    }

    if (intent.kind === 'party') {
      if (intent.alreadyJoined) {
        if (nextTrainingBattleId !== null) {
          setMessage('BYTE: まずGREENFIELD VILLAGEのTRAINで、コードを小さいところから読んでみよう。')
        } else if (!progress.clearedStageIds.includes(12)) {
          setMessage('BYTE: 次は西のFOREST。&&と||も、小さな条件へ分ければ読めるよ。')
        } else if (!progress.clearedStageIds.includes(13)) {
          setMessage('BYTE: 森の西側に守り人がいる。新しい記号はないから、今までの読み方だけで挑もう。')
        } else if (!progress.clearedStageIds.includes(14)) {
          setMessage('BYTE: 守り人の先のWoodsへ行こう。次はfind()の「最初の一体」と、filter()の「全部集める」を比べる。')
        } else if (!progress.clearedStageIds.includes(15)) {
          setMessage('BYTE: filter()の基本は読めた。Forest西端からDEEP FORESTへ進んで、今度は>の条件でも全部集められるか確かめよう。')
        } else if (!progress.clearedStageIds.includes(1)) {
          setMessage('BYTE: 敵のHPと、技の横に出るコードを順番に見てみよう。')
        } else if (!progress.clearedStageIds.includes(2)) {
          setMessage('BYTE: 別の技でも同じようなズレがあるみたい。西でもう少し確かめよう。')
        } else if (!progress.clearedAreaIds.includes('javascript')) {
          setMessage('BYTE: 原因はもっと西の奥につながってる。Code Coreまで行ってみよう。')
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
        partyEquipment: {
          ...current.partyEquipment,
          [intent.memberId]: emptyPartyEquipment(),
        },
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
            ? 'まだ奥へは進めない。西でBattleを重ねて、異変をもう少し確かめよう。'
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
        : isForest
          ? progress.clearedStageIds.includes(14)
            ? '西端のEXITからDEEP FORESTへ進める。Woodsでは&& / || / filter()を復習できる。'
            : progress.clearedStageIds.includes(13)
              ? '守り人の先へ進める。西側のWoodsで、次の読み方を確かめよう。'
              : '木々の間に道が続いている。Woodsでは復習Battle、main trailの西側には守り人がいる。'
          : isDeepForest
            ? progress.clearedStageIds.includes(15)
              ? 'Deep Woodsでは、条件違いのfilter()を反復できる。'
              : '入口の道を外れてDeep Woodsへ踏み込むと、filter()の条件違いを読むLessonが始まる。'
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (shopOpen || innOpen || document.body.dataset.rpgPaused === 'true') return
      const key = event.key.toLowerCase()
      if (key === 'arrowup' || key === 'w') {
        event.preventDefault()
        move(0, -1)
      } else if (key === 'arrowdown' || key === 's') {
        event.preventDefault()
        move(0, 1)
      } else if (key === 'arrowleft' || key === 'a') {
        event.preventDefault()
        move(-1, 0)
      } else if (key === 'arrowright' || key === 'd') {
        event.preventDefault()
        move(1, 0)
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        interact()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [innOpen, interact, move, shopOpen])

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
                : isForest
                  ? 'JAVASCRIPT FOREST'
                  : isDeepForest
                    ? 'JAVASCRIPT DEEP FOREST'
                    : 'CODE WORLD'}
            </h1>
            <p>
              {isVillage
                ? 'JavaScript地方の小さな村。中央のTRAINでコードの読み方を練習し、南の出口から草原へ戻れる。'
                : isForest
                  ? 'JavaScript地方の森。東側で&& / ||を読み、守り人の先ではfind()とfilter()の違いを学ぶ。'
                  : isDeepForest
                    ? 'JavaScript地方の深い森。filter()を条件違いでも反復し、その先の新しい読み方へ備える。'
                    : region === 'javascript'
                      ? javascriptStoryBrief
                      : region === 'typescript'
                        ? '東側はTypeScript地方。西とは違うruleを読みながら進む。'
                        : '中央のHubから、西のJavaScript地方と東のTypeScript地方へ進める。'}
            </p>
          </div>
        </header>

        <section
          className={`world-next-objective pixel-inner-window ${currentObjective.clear ? 'is-clear' : ''}`}
          aria-label="Next objective"
        >
          <span>{currentObjective.label}</span>
          <strong>{currentObjective.title}</strong>
          <p>{currentObjective.detail}</p>
        </section>

        <div
          className="world-viewport pixel-inner-window"
          aria-label={
            isVillage
              ? 'Village map'
              : isForest
                ? 'Forest map'
                : isDeepForest
                  ? 'Deep Forest map'
                  : 'Open world map'
          }
          data-world-map={mapId}
          data-world-x={position.x}
          data-world-y={position.y}
        >
          {visibleCells.map((cell) => {
            const renderedTerrain =
              cell.terrain === 'midboss' && progress.clearedStageIds.includes(13)
                ? 'road'
                : cell.terrain
            const treasure =
              renderedTerrain === 'treasure' ? getTreasureAtPosition(cell, mapId) : undefined
            const treasureOpened = treasure
              ? rpgState.openedTreasureIds.includes(treasure.id)
              : false
            return (
              <div
                key={`${cell.mapId}:${cell.x}:${cell.y}`}
                className={`world-tile terrain-${renderedTerrain}`}
                title={terrainLabels[renderedTerrain]}
                data-world-map={cell.mapId}
                data-world-x={cell.x}
                data-world-y={cell.y}
              >
                {renderedTerrain === 'boss' && <span className="world-object boss-object">BOSS</span>}
                {renderedTerrain === 'midboss' && (
                  <span className="world-object midboss-object" aria-label="JavaScript Forest Mid-Boss">
                    MID BOSS
                  </span>
                )}
                {renderedTerrain === 'shop' && <span className="world-object shop-object">SHOP</span>}
                {renderedTerrain === 'village' && (
                  <span className="world-object village-object">VILLAGE</span>
                )}
                {renderedTerrain === 'exit' && <span className="world-object exit-object">EXIT</span>}
                {renderedTerrain === 'training' && (
                  <span className="world-object training-object" aria-label="JavaScript Training Ground">
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
              </div>
            )
          })}

          <div
            className="world-character-layer"
            aria-hidden="true"
            data-world-map={mapId}
            data-world-x={position.x}
            data-world-y={position.y}
          >
            {followerVisible && (
              <span
                className="world-follower-sprite world-character-overlay"
                style={spriteStyle(followerPosition)}
                data-world-map={mapId}
                data-world-x={followerPosition.x}
                data-world-y={followerPosition.y}
              >
                <img
                  className="world-follower-pixel"
                  src={characterVisuals.byte.field}
                  alt=""
                />
              </span>
            )}

            <span
              className="world-player-sprite world-character-overlay"
              style={spriteStyle(position)}
              data-world-map={mapId}
              data-world-x={position.x}
              data-world-y={position.y}
            >
              <img
                className="world-player-pixel"
                src={characterVisuals.player.field}
                alt=""
              />
            </span>
          </div>
        </div>

        <section className="world-message pixel-inner-window" aria-live="polite">
          <span>FIELD LOG</span>
          <p>{message}</p>
        </section>

        <div className="world-controls" aria-label="World controls">
          <div className="world-dpad">
            <button type="button" aria-label="Move up" onClick={() => move(0, -1)}>
              ▲
            </button>
            <button type="button" aria-label="Move left" onClick={() => move(-1, 0)}>
              ◀
            </button>
            <button type="button" aria-label="Move down" onClick={() => move(0, 1)}>
              ▼
            </button>
            <button type="button" aria-label="Move right" onClick={() => move(1, 0)}>
              ▶
            </button>
          </div>
          <button type="button" className="primary-button world-interact" onClick={interact}>
            INTERACT
          </button>
        </div>
      </section>

      <WorldShop open={shopOpen} onClose={() => setShopOpen(false)} onMessage={setMessage} />
      <WorldInn open={innOpen} onClose={() => setInnOpen(false)} onMessage={setMessage} />
    </main>
  )
}

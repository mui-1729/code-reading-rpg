import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { gameAudio } from '../audio/gameAudio'
import { useBgm } from '../audio/useBgm'
import { useProgress } from '../progression'
import { useRpg } from '../rpg'
import { openWorldTreasure } from './treasures'
import { resolveWorldMove } from './worldActions'
import {
  getTreasureAtPosition,
  getVisibleWorldCells,
  isAdjacent,
  TS_BOSS_POSITION,
  TS_FRONTIER_MAP_ID,
} from './worldMap'
import { WorldCharacterLayer, WorldControls, WorldObjectiveCard, WorldViewport } from './WorldScene'
import { useWorldKeyboardControls } from './useWorldKeyboardControls'
import type { WorldPosition } from './worldSceneGeometry'

const terrainLabels: Record<string, string> = {
  mountain: '崩れた境界',
  stone: 'ルーン石の道',
  crystal: 'Crystal Field · TypeScript戦闘',
  ruins: 'Ancient Ruins · TypeScript戦闘',
  gate: '地方の門',
  boss: 'Type Warden',
  treasure: 'Type Cache',
  grass: 'Frontierの草地',
  forest: '型の森 · TypeScript戦闘',
}

function getObjective(clearedStageIds: readonly number[]) {
  if (!clearedStageIds.includes(4)) {
    return {
      label: 'TYPESCRIPT · 1 / 3',
      title: '型ラベルが対象ルールへどう影響するか読む',
      detail: 'GATEから東のCrystal Field / Ruinsへ進もう。最初の戦闘はBattle 4。',
      clear: false,
    }
  }
  if (!clearedStageIds.includes(5)) {
    return {
      label: 'TYPESCRIPT · 2 / 3',
      title: 'もう一つの型ルールを読み比べる',
      detail: 'さらに東へ進み、Battle 5で型情報を使った別の対象ルールを読む。',
      clear: false,
    }
  }
  if (!clearedStageIds.includes(6)) {
    return {
      label: 'TYPESCRIPT · 3 / 3 · ボス',
      title: '北東のTYPE WARDENへ向かう',
      detail: '二つのTypeScript戦闘を読み終えた。北東のボスの隣でINTERACTし、Battle 6へ挑もう。',
      clear: false,
    }
  }
  return {
    label: 'TYPESCRIPT クリア',
    title: 'TypeScript Frontierの異変を止めた',
    detail: '西のGATEからCentral Hubへ戻れる。',
    clear: true,
  }
}

export function TypeScriptFrontierPage() {
  const navigate = useNavigate()
  const { progress, setProgress } = useProgress()
  const { rpgState, setRpgState } = useRpg()
  const [message, setMessage] = useState(
    'ルーン石の道を進み、Crystal / RuinsでTypeScriptのルールを読もう。',
  )
  useBgm('field')

  const position = rpgState.worldPosition
  const [followerPosition, setFollowerPosition] = useState<WorldPosition>(() => ({
    x: position.x,
    y: position.y + 1,
  }))
  const visibleCells = useMemo(() => getVisibleWorldCells(position, TS_FRONTIER_MAP_ID), [position])
  const viewportStart = visibleCells[0] ?? position
  const byteJoined = rpgState.partyMemberIds.includes('byte')
  const objective = getObjective(progress.clearedStageIds)

  const enterBattle = useCallback(
    (battleId: number, seed: string) => {
      gameAudio.playSe('confirm')
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
      if (document.body.dataset.rpgPaused === 'true') return

      const result = resolveWorldMove({ rpgState, progress, dx, dy })
      if (result.kind === 'blocked') {
        gameAudio.playSe('cancel')
        setMessage(
          result.terrain === 'boss'
            ? 'TYPE WARDENが道を塞いでいる。隣からINTERACT。'
            : result.terrain === 'treasure'
              ? 'TYPE CACHE。隣からINTERACTして調べる。'
              : '崩れた境界の先へは進めない。',
        )
        return
      }

      if (result.kind === 'transition') {
        setRpgState(result.nextState)
        gameAudio.playSe('confirm')
        setMessage(`${result.label}へ戻った。JavaScript地方とTypeScript地方はGATEで分かれている。`)
        return
      }

      if (byteJoined) setFollowerPosition(position)
      setRpgState(result.nextState)
      if (result.kind === 'encounter') {
        setMessage('TypeScript戦闘！')
        enterBattle(result.battle.battleId, result.battle.seed)
        return
      }

      setMessage(terrainLabels[result.terrain] ?? result.terrain)
    },
    [byteJoined, enterBattle, position, progress, rpgState, setRpgState],
  )

  const interact = useCallback(() => {
    if (document.body.dataset.rpgPaused === 'true') return

    const treasure = getTreasureAtPosition({ x: position.x, y: position.y }, TS_FRONTIER_MAP_ID)
    const adjacentTreasure = visibleCells
      .map((cell) => getTreasureAtPosition(cell, TS_FRONTIER_MAP_ID))
      .find((candidate) => candidate && isAdjacent(position, candidate.position))

    if (treasure || adjacentTreasure) {
      const target = treasure ?? adjacentTreasure
      if (!target) return
      const result = openWorldTreasure(progress, rpgState, target.id)
      if (!result.opened) {
        gameAudio.playSe('cancel')
        setMessage(`${result.definition.name}: すでに空だ。`)
        return
      }
      setProgress(result.progress)
      setRpgState(result.rpgState)
      gameAudio.playSe('confirm')
      setMessage(
        `${result.definition.name} 開封 → +${result.definition.reward.gold} G` +
          (result.definition.reward.patchKit > 0
            ? ` / PATCH KIT ×${result.definition.reward.patchKit}`
            : ''),
      )
      return
    }

    if (isAdjacent(position, TS_BOSS_POSITION)) {
      if (!progress.unlockedStageIds.includes(6) && !progress.clearedStageIds.includes(5)) {
        gameAudio.playSe('cancel')
        setMessage(
          'BYTE: まずFrontierのBattle 4 / 5を終わらせよう。二つの型ルールが揃えばTYPE WARDENへ挑める。',
        )
        return
      }
      enterBattle(6, `boss:ts:${rpgState.encounterCount}`)
      return
    }

    setMessage(
      progress.clearedStageIds.includes(5)
        ? '北東のTYPE WARDENへ向かおう。ボスの隣でINTERACT。'
        : '石畳を外れてCrystal / Ruinsへ入るとTypeScript戦闘が起こる。',
    )
  }, [enterBattle, position, progress, rpgState, setProgress, setRpgState, visibleCells])

  useWorldKeyboardControls({ interact, move })

  return (
    <main className="app-shell world-shell title-screen">
      <section className="pixel-window world-panel typescript-frontier-panel">
        <header className="world-header">
          <div>
            <div className="eyebrow">ローカルマップ // TYPESCRIPT FRONTIER</div>
            <h1>TYPESCRIPT FRONTIER</h1>
            <p>
              JavaScriptの草原とは別の地方。Rune Stone Roadを軸に、Crystal FieldとAncient
              Ruinsで型のルールを読む。
            </p>
          </div>
        </header>

        <WorldObjectiveCard objective={objective} />

        <WorldViewport
          mapId={TS_FRONTIER_MAP_ID}
          playerPosition={position}
          cells={visibleCells}
          terrainLabels={terrainLabels}
          className="typescript-frontier-viewport"
          label="TypeScript Frontier map"
          renderObject={(cell) => {
            const treasureDefinition =
              cell.terrain === 'treasure'
                ? getTreasureAtPosition(cell, TS_FRONTIER_MAP_ID)
                : undefined
            const treasureOpened = treasureDefinition
              ? rpgState.openedTreasureIds.includes(treasureDefinition.id)
              : false

            return (
              <>
                {cell.terrain === 'gate' && (
                  <span className="world-object ts-gate-object">GATE</span>
                )}
                {cell.terrain === 'boss' && (
                  <span className="world-object boss-object">TYPE WARDEN</span>
                )}
                {treasureDefinition && (
                  <span
                    className={`world-object treasure-object ${treasureOpened ? 'opened' : ''}`}
                    aria-label={`${treasureDefinition.id} treasure ${treasureOpened ? 'opened' : 'closed'}`}
                  >
                    {treasureOpened ? 'OPEN' : 'TYPE CACHE'}
                  </span>
                )}
              </>
            )
          }}
        >
          <WorldCharacterLayer
            mapId={TS_FRONTIER_MAP_ID}
            playerPosition={position}
            viewportStart={viewportStart}
            followerPosition={followerPosition}
            followerJoined={byteJoined}
          />
        </WorldViewport>

        <section className="world-message pixel-inner-window" aria-live="polite">
          <span>フロンティアログ</span>
          <p>{message}</p>
        </section>

        <WorldControls move={move} interact={interact} />
      </section>
    </main>
  )
}

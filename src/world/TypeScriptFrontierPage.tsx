import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { gameAudio } from '../audio/gameAudio'
import { useBgm } from '../audio/useBgm'
import { WorldInn, WorldShop } from '../economy'
import { useProgress } from '../progression'
import { useRpg } from '../rpg'
import { openWorldTreasure } from './treasures'
import { useEncounterCue } from './useEncounterCue'
import { resolveWorldMove } from './worldActions'
import { registerCheckpointForWorldPosition } from './worldCheckpoints'
import {
  getTreasureAtPosition,
  getVisibleWorldCells,
  TS_FRONTIER_MAP_ID,
} from './worldMap'
import { getWorldFacingFromMove, getWorldInteractionTarget } from './worldInteractionTarget'
import type { WorldFacing } from './worldPresentation'
import { WorldCharacterLayer, WorldControls, WorldObjectiveCard, WorldViewport } from './WorldScene'
import { useWorldKeyboardControls } from './useWorldKeyboardControls'
import type { WorldPosition } from './worldSceneGeometry'
import { resolveWorldTargetInteraction } from './worldTargetInteraction'
import {
  TS_FRONTIER_OUTPOST_CHECKPOINT_POSITION,
  TS_FRONTIER_OUTPOST_LABEL,
} from './typescriptFrontierOutpost'

const terrainLabels: Record<string, string> = {
  mountain: '崩れた境界',
  stone: 'ルーン石の道',
  crystal: 'クリスタル地帯 · TypeScript戦闘',
  ruins: '古代遺跡 · TypeScript戦闘',
  gate: '地方の門',
  boss: 'FRONTIER COMPILER',
  treasure: 'TYPE CACHE',
  grass: '辺境の草地',
  forest: '型の森 · TypeScript戦闘',
}

function getObjective(clearedStageIds: readonly number[]) {
  if (!clearedStageIds.includes(4)) {
    return {
      label: 'TypeScript · 1 / 3',
      title: '型ラベルが対象ルールへどう影響するか読む',
      detail: '境界監視所で準備したら東のクリスタル地帯 / 古代遺跡へ進もう。最初の戦闘はBattle 4。',
      clear: false,
    }
  }
  if (!clearedStageIds.includes(5)) {
    return {
      label: 'TypeScript · 2 / 3',
      title: 'もう一つの型ルールを読み比べる',
      detail: 'さらに東へ進み、Battle 5で型情報を使った別の対象ルールを読む。',
      clear: false,
    }
  }
  if (!clearedStageIds.includes(6)) {
    return {
      label: 'TypeScript · 3 / 3 · ボス',
      title: '北東のFRONTIER COMPILERへ向かう',
      detail: '二つのTypeScript戦闘を読み終えた。必要なら境界監視所で準備し、北東のボスへ挑もう。',
      clear: false,
    }
  }
  return {
    label: 'TypeScript クリア',
    title: 'TypeScript辺境の異変を止めた',
    detail: '境界監視所で旅支度を整えるか、西の門から中央ハブへ戻れる。',
    clear: true,
  }
}

export function TypeScriptFrontierPage() {
  const navigate = useNavigate()
  const { progress, setProgress } = useProgress()
  const { rpgState, setRpgState } = useRpg()
  const [message, setMessage] = useState(
    '西の境界監視所で準備し、ルーン石の道を東へ進もう。',
  )
  const [shopOpen, setShopOpen] = useState(false)
  const [innOpen, setInnOpen] = useState(false)
  useBgm('field')
  const { encounterCueActive, startEncounterCue } = useEncounterCue()

  const position = rpgState.worldPosition
  const [playerFacing, setPlayerFacing] = useState<WorldFacing>('down')
  const [followerPosition, setFollowerPosition] = useState<WorldPosition>(() => ({
    x: position.x,
    y: position.y + 1,
  }))
  const visibleCells = useMemo(() => getVisibleWorldCells(position, TS_FRONTIER_MAP_ID), [position])
  const viewportStart = visibleCells[0] ?? position
  const byteJoined = rpgState.partyMemberIds.includes('byte')
  const objective = getObjective(progress.clearedStageIds)
  const interactionTarget = useMemo(
    () => getWorldInteractionTarget(position, playerFacing),
    [playerFacing, position],
  )
  const interactionIntent = useMemo(
    () => resolveWorldTargetInteraction(rpgState, progress, interactionTarget),
    [interactionTarget, progress, rpgState],
  )

  const enterBattle = useCallback(
    (battleId: number, seed: string, playConfirm = true) => {
      if (playConfirm) gameAudio.playSe('confirm')
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

      setPlayerFacing((current) => getWorldFacingFromMove(dx, dy, current))
      const result = resolveWorldMove({ rpgState, progress, dx, dy })
      if (result.kind === 'blocked') return

      if (result.kind === 'transition') {
        setRpgState(result.nextState)
        gameAudio.playSe('confirm')
        setMessage(`${result.label}へ戻った。JavaScript地方とTypeScript地方は門で分かれている。`)
        return
      }

      if (byteJoined) setFollowerPosition(position)
      const nextState = registerCheckpointForWorldPosition(result.nextState)
      const reachedOutpost =
        rpgState.safeCheckpoint.id !== 'typescript-frontier-outpost' &&
        nextState.safeCheckpoint.id === 'typescript-frontier-outpost'
      setRpgState(nextState)
      if (result.kind === 'encounter') {
        startEncounterCue(() => {
          enterBattle(result.battle.battleId, result.battle.seed, false)
        })
        return
      }

      if (reachedOutpost) {
        setMessage('境界監視所に着いた。宿・補給所・TYPE WARDENがいる。ここを足場に東を調べよう。')
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

    const intent = interactionIntent

    if (intent.kind === 'map-transition') {
      setRpgState(intent.nextState)
      gameAudio.playSe('confirm')
      setMessage(`${intent.label}へ戻った。JavaScript地方とTypeScript地方は門で分かれている。`)
      return
    }

    if (intent.kind === 'locked-portal') {
      gameAudio.playSe('cancel')
      setMessage(`${intent.label}への道はまだ開いていない。`)
      return
    }

    if (intent.kind === 'shop') {
      gameAudio.playSe('confirm')
      setShopOpen(true)
      setMessage('境界監視所の補給所: 東へ進む前に道具と装備を整えられる。')
      return
    }

    if (intent.kind === 'recovery') {
      gameAudio.playSe('confirm')
      setInnOpen(true)
      setMessage('境界監視所の宿: ゴールドを払ってHPを全回復できる。')
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
      gameAudio.playSe('confirm')
      setMessage(
        `${result.definition.name} 開封 → +${result.definition.reward.gold} G` +
          (result.definition.reward.patchKit > 0
            ? ` / PATCH KIT ×${result.definition.reward.patchKit}`
            : ''),
      )
      return
    }

    if (intent.kind === 'boss') {
      if (!intent.unlocked) {
        gameAudio.playSe('cancel')
        setMessage(
          'BYTE: まずTypeScript辺境のBattle 4 / 5を終わらせよう。二つの型ルールが揃えばFRONTIER COMPILERへ挑める。',
        )
        return
      }
      enterBattle(intent.battleId, intent.seed)
    }
  }, [
    encounterCueActive,
    enterBattle,
    innOpen,
    interactionIntent,
    progress,
    rpgState,
    setProgress,
    setRpgState,
    shopOpen,
  ])

  useWorldKeyboardControls({
    interact,
    move,
    disabled: encounterCueActive || shopOpen || innOpen,
  })

  return (
    <main className="app-shell world-shell title-screen">
      <section className="pixel-window world-panel typescript-frontier-panel">
        <header className="world-header">
          <div>
            <div className="eyebrow">ローカルマップ // TypeScript辺境</div>
            <h1>TypeScript辺境</h1>
            <p>
              石造の境界監視所を足場に、ルーン石の道・クリスタル地帯・古代遺跡を東へ進む地方。
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
          label="TypeScript辺境のマップ"
          renderObject={(cell) => {
            const treasureDefinition =
              cell.terrain === 'treasure'
                ? getTreasureAtPosition(cell, TS_FRONTIER_MAP_ID)
                : undefined
            const treasureOpened = treasureDefinition
              ? rpgState.openedTreasureIds.includes(treasureDefinition.id)
              : false
            const isOutpostCenter =
              cell.x === TS_FRONTIER_OUTPOST_CHECKPOINT_POSITION.x &&
              cell.y === TS_FRONTIER_OUTPOST_CHECKPOINT_POSITION.y

            return (
              <>
                {cell.terrain === 'gate' && (
                  <span className="world-object ts-gate-object">門</span>
                )}
                {isOutpostCenter && (
                  <span className="world-object ts-outpost-object" aria-label={TS_FRONTIER_OUTPOST_LABEL}>
                    監視所
                  </span>
                )}
                {cell.terrain === 'boss' && (
                  <span className="world-object boss-object">FRONTIER COMPILER</span>
                )}
                {treasureDefinition && (
                  <span
                    className={`world-object treasure-object ${treasureOpened ? 'opened' : ''}`}
                    aria-label={`TYPE CACHE ${treasureOpened ? '開封済み' : '未開封'}`}
                  >
                    {treasureOpened ? '開封済み' : 'TYPE CACHE'}
                  </span>
                )}
              </>
            )
          }}
        >
          <WorldCharacterLayer
            mapId={TS_FRONTIER_MAP_ID}
            playerPosition={position}
            playerFacing={playerFacing}
            viewportStart={viewportStart}
            followerPosition={followerPosition}
            followerJoined={byteJoined}
          />
        </WorldViewport>

        <section className="world-message pixel-inner-window" aria-live="polite">
          <span>フロンティアログ</span>
          <p>{message}</p>
        </section>

        <WorldControls move={move} interact={interact} interactionIntent={interactionIntent} />
      </section>

      <WorldShop
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        onMessage={setMessage}
        locationLabel={TS_FRONTIER_OUTPOST_LABEL}
      />
      <WorldInn
        open={innOpen}
        onClose={() => setInnOpen(false)}
        onMessage={setMessage}
        locationLabel={TS_FRONTIER_OUTPOST_LABEL}
        checkpointId="typescript-frontier-outpost"
      />
    </main>
  )
}

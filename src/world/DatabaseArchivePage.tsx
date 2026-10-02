import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { gameAudio } from '../audio/gameAudio'
import { useProgress } from '../progression'
import { useRpg } from '../rpg'
import { useSceneTransition } from '../transition/useSceneTransition'
import { DATABASE_ARCHIVE_MAP_ID, DATABASE_LOCKED_MESSAGE } from './databaseArchive'
import { getDatabaseArchiveObjective } from './worldObjective'
import { resolveWorldMove } from './worldActions'
import { getVisibleWorldCells } from './worldMap'
import { getWorldFacingFromMove, getWorldInteractionTarget } from './worldInteractionTarget'
import { resolveWorldTargetInteraction } from './worldTargetInteraction'
import type { WorldFacing } from './worldPresentation'
import { WorldCharacterLayer, WorldControls, WorldObjectiveCard, WorldViewport } from './WorldScene'
import { useWorldKeyboardControls } from './useWorldKeyboardControls'

const terrainLabels = {
  mountain: '書庫の石壁',
  house: '記録を収めた書棚',
  stone: '書庫の床',
  road: '閲覧通路',
  training: '台帳の閲覧台',
  exit: 'TypeScript辺境への階段',
}

export function DatabaseArchivePage() {
  const navigate = useNavigate()
  const { progress } = useProgress()
  const { rpgState, setRpgState } = useRpg()
  const { isTransitioning, runSceneTransition } = useSceneTransition()
  const [playerFacing, setPlayerFacing] = useState<WorldFacing>('up')
  const [message, setMessage] = useState(
    'BYTE: ここは地下書庫。書棚の間を進み、北東の閲覧台で消えた記録を調べよう。',
  )
  const position = rpgState.worldPosition
  const [followerPosition, setFollowerPosition] = useState({ x: position.x, y: position.y + 1 })
  const visibleCells = useMemo(
    () => getVisibleWorldCells(position, DATABASE_ARCHIVE_MAP_ID),
    [position],
  )
  const target = getWorldInteractionTarget(position, playerFacing)
  const interactionIntent = resolveWorldTargetInteraction(rpgState, progress, target)

  const move = useCallback(
    (dx: number, dy: number) => {
      if (isTransitioning || document.body.dataset.rpgPaused === 'true') return
      setPlayerFacing((current) => getWorldFacingFromMove(dx, dy, current))
      const result = resolveWorldMove({ rpgState, progress, dx, dy })
      if (result.kind === 'blocked') return
      setFollowerPosition(position)
      setRpgState(result.nextState)
    },
    [isTransitioning, position, progress, rpgState, setRpgState],
  )

  const interact = useCallback(() => {
    if (isTransitioning || document.body.dataset.rpgPaused === 'true') return
    if (interactionIntent.kind === 'map-transition') {
      void runSceneTransition('map', () => setRpgState(interactionIntent.nextState), {
        fromMapId: DATABASE_ARCHIVE_MAP_ID,
        toMapId: interactionIntent.toMapId,
      })
    } else if (interactionIntent.kind === 'archive-trial') {
      if (!interactionIntent.unlocked) {
        gameAudio.playSe('cancel')
        setMessage(DATABASE_LOCKED_MESSAGE)
        return
      }
      setRpgState({ ...rpgState, encounterCount: rpgState.encounterCount + 1 })
      void runSceneTransition('battle-start', () =>
        navigate({
          to: '/$areaId/battle/$battleId',
          params: { areaId: 'database', battleId: '23' },
          search: { seed: interactionIntent.seed, returnTo: '/world' },
        }),
      )
    }
  }, [interactionIntent, isTransitioning, navigate, rpgState, runSceneTransition, setRpgState])

  useWorldKeyboardControls({ move, interact, disabled: isTransitioning })

  return (
    <main className="app-shell world-shell title-screen">
      <section className="pixel-window world-panel database-archive-panel">
        <WorldObjectiveCard objective={getDatabaseArchiveObjective(progress.clearedStageIds)} />
        <WorldViewport
          mapId={DATABASE_ARCHIVE_MAP_ID}
          playerPosition={position}
          cells={visibleCells}
          terrainLabels={terrainLabels}
          className="database-archive-viewport"
          label="地下書庫のマップ"
          renderObject={(cell) =>
            cell.terrain === 'training' ? (
              <span className="world-object archive-lectern" aria-label="台帳の閲覧台">
                台帳
              </span>
            ) : cell.terrain === 'exit' ? (
              <span className="world-object archive-stairs" aria-label="TypeScript辺境への階段">
                階段
              </span>
            ) : null
          }
        >
          <WorldCharacterLayer
            mapId={DATABASE_ARCHIVE_MAP_ID}
            playerPosition={position}
            playerFacing={playerFacing}
            viewportStart={visibleCells[0] ?? position}
            followerPosition={followerPosition}
            followerJoined={rpgState.partyMemberIds.includes('byte')}
          />
        </WorldViewport>
        <section className="world-message pixel-inner-window" aria-live="polite">
          <span>書庫の記録</span>
          <p>{message}</p>
        </section>
        <WorldControls move={move} interact={interact} interactionIntent={interactionIntent} />
      </section>
    </main>
  )
}

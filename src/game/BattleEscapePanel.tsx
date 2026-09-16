import { useNavigate } from '@tanstack/react-router'
import { useProgress } from '../progression'
import { useSceneTransition } from '../transition/useSceneTransition'
import { getAreaCapability } from './areas'
import { isBattleEscapeAllowed } from './battleEscape'

type BattleEscapePanelProps = {
  areaId: string
  battleId: number
  seed: string
  returnTo?: string
  actionLocked: boolean
  onRun: () => void
}

export function BattleEscapePanel({ areaId, battleId, seed, returnTo, actionLocked, onRun }: BattleEscapePanelProps) {
  const navigate = useNavigate()
  const { progress } = useProgress()
  const { isTransitioning, runSceneTransition } = useSceneTransition()
  if (!getAreaCapability(areaId, 'escape')) return null
  const allowed = isBattleEscapeAllowed({
    battleId,
    seed,
    returnTo: returnTo ?? null,
    clearedStageIds: progress.clearedStageIds,
  })

  // Keep a non-rendered layout anchor for reference-action geometry without exposing
  // a disabled escape command or fixed-battle explanation to the player.
  if (!allowed) return <div className="battle-escape-row" hidden aria-hidden="true" />

  const escape = () => {
    if (actionLocked || isTransitioning) return
    void runSceneTransition(
      'battle-return',
      () => {
        onRun()
        return navigate({ to: '/world' })
      },
      { label: '戦闘から離脱' },
    )
  }

  return (
    <div className="battle-escape-row">
      <button
        type="button"
        className="secondary-button battle-escape-action"
        onClick={escape}
        disabled={actionLocked || isTransitioning}
        aria-label="逃げる"
        title="この戦闘から離脱してワールドへ戻る"
      >
        逃げる
      </button>
    </div>
  )
}

import { useNavigate } from '@tanstack/react-router'
import { gameAudio } from '../audio/gameAudio'
import { useProgress } from '../progression'
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
  if (!getAreaCapability(areaId, 'escape')) return null
  const allowed = isBattleEscapeAllowed({
    battleId,
    seed,
    returnTo: returnTo ?? null,
    clearedStageIds: progress.clearedStageIds,
  })

  // Keep a non-rendered layout anchor for reference-action geometry without exposing
  // a disabled RUN command or fixed-battle explanation to the player.
  if (!allowed) return <div className="battle-escape-row" hidden aria-hidden="true" />

  const escape = () => {
    if (actionLocked) return
    gameAudio.playSe('confirm')
    onRun()
    navigate({ to: '/world' })
  }

  return (
    <div className="battle-escape-row">
      <button
        type="button"
        className="secondary-button battle-escape-action"
        onClick={escape}
        disabled={actionLocked}
        aria-label="RUN · ESCAPE"
        title="この戦闘から離脱してWorldへ戻る"
      >
        RUN
      </button>
    </div>
  )
}

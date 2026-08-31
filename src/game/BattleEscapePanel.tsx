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

  const escape = () => {
    if (!allowed || actionLocked) return
    gameAudio.playSe('confirm')
    onRun()
    navigate({ to: '/world' })
  }

  return (
    <div className="battle-escape-row">
      <button type="button" className="secondary-button battle-escape-action" onClick={escape} disabled={!allowed || actionLocked}>
        {allowed ? 'RUN · ESCAPE' : 'RUN LOCKED · FIXED BATTLE'}
      </button>
      <span className="battle-item-state">
        {allowed
          ? 'Random Encounterから離脱し、元いたWorld位置へ戻る · reward / clearなし'
          : 'Fixed Lesson / Bossは最後まで挑戦する'}
      </span>
    </div>
  )
}

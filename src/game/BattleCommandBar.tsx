import { useNavigate } from '@tanstack/react-router'
import { gameAudio } from '../audio/gameAudio'
import { useProgress } from '../progression'
import { getAreaCapability } from './areas'
import { isBattleEscapeAllowed } from './battleEscape'

export type BattleCommand = 'fight' | 'items' | null

type BattleCommandBarProps = {
  command: BattleCommand
  areaId: string
  battleId: number
  seed: string
  returnTo?: string
  actionLocked: boolean
  onCommandChange: (command: Exclude<BattleCommand, null>) => void
  onRun: () => void
}

export function BattleCommandBar({
  command,
  areaId,
  battleId,
  seed,
  returnTo,
  actionLocked,
  onCommandChange,
  onRun,
}: BattleCommandBarProps) {
  const navigate = useNavigate()
  const { progress } = useProgress()
  const escapeAllowed = getAreaCapability(areaId, 'escape') && isBattleEscapeAllowed({
    battleId,
    seed,
    returnTo: returnTo ?? null,
    clearedStageIds: progress.clearedStageIds,
  })

  const select = (next: Exclude<BattleCommand, null>) => {
    if (actionLocked) return
    gameAudio.playSe('confirm')
    onCommandChange(next)
  }

  const escape = () => {
    if (actionLocked || !escapeAllowed) return
    gameAudio.playSe('confirm')
    onRun()
    navigate({ to: '/world' })
  }

  return (
    <div className="battle-command-bar" role="group" aria-label="戦闘コマンド">
      <button
        type="button"
        className={`battle-command-button ${command === 'fight' ? 'is-active' : ''}`}
        aria-pressed={command === 'fight'}
        disabled={actionLocked}
        onClick={() => select('fight')}
      >
        戦う
      </button>
      <button
        type="button"
        className={`battle-command-button ${command === 'items' ? 'is-active' : ''}`}
        aria-pressed={command === 'items'}
        disabled={actionLocked}
        onClick={() => select('items')}
      >
        アイテム
      </button>
      {escapeAllowed && (
        <button
          type="button"
          className="battle-command-button"
          disabled={actionLocked}
          onClick={escape}
          aria-label="逃げる"
        >
          逃げる
        </button>
      )}
    </div>
  )
}

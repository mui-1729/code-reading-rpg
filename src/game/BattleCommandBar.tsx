import { useState } from 'react'
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
  const [escapeConfirmOpen, setEscapeConfirmOpen] = useState(false)
  const escapeAllowed = getAreaCapability(areaId, 'escape') && isBattleEscapeAllowed({
    battleId,
    seed,
    returnTo: returnTo ?? null,
    clearedStageIds: progress.clearedStageIds,
  })

  const select = (next: Exclude<BattleCommand, null>) => {
    if (actionLocked) return
    gameAudio.playSe('confirm')
    setEscapeConfirmOpen(false)
    onCommandChange(next)
  }

  const requestEscape = () => {
    if (actionLocked || !escapeAllowed) return
    gameAudio.playSe('select')
    setEscapeConfirmOpen(true)
  }

  const cancelEscape = () => {
    gameAudio.playSe('cancel')
    setEscapeConfirmOpen(false)
  }

  const confirmEscape = () => {
    if (actionLocked || !escapeAllowed) return
    gameAudio.playSe('confirm')
    onRun()
    navigate({ to: '/world' })
  }

  if (escapeConfirmOpen) {
    return (
      <div
        className="battle-command-bar battle-escape-confirm"
        role="group"
        aria-label="逃走確認"
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return
          event.preventDefault()
          cancelEscape()
        }}
      >
        <span className="battle-escape-confirm-copy">逃げますか？</span>
        <button
          type="button"
          className="battle-command-button"
          disabled={actionLocked}
          onClick={confirmEscape}
        >
          逃げる
        </button>
        <button
          type="button"
          className="battle-command-button"
          disabled={actionLocked}
          onClick={cancelEscape}
          autoFocus
        >
          やめる
        </button>
      </div>
    )
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
          onClick={requestEscape}
          aria-label="逃げる"
        >
          逃げる
        </button>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { gameAudio } from '../audio/gameAudio'
import { useProgress } from '../progression'
import { useSceneTransition } from '../transition/useSceneTransition'
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
  const { isTransitioning, runSceneTransition } = useSceneTransition()
  const [escapeConfirmOpen, setEscapeConfirmOpen] = useState(false)
  const escapeBackRef = useRef<HTMLButtonElement>(null)
  const escapeAllowed = getAreaCapability(areaId, 'escape') && isBattleEscapeAllowed({
    battleId,
    seed,
    returnTo: returnTo ?? null,
    clearedStageIds: progress.clearedStageIds,
  })

  useEffect(() => {
    if (!escapeConfirmOpen) return
    escapeBackRef.current?.focus({ preventScroll: true })
  }, [escapeConfirmOpen])

  const select = (next: Exclude<BattleCommand, null>) => {
    if (actionLocked || isTransitioning) return
    gameAudio.playSe('confirm')
    setEscapeConfirmOpen(false)
    onCommandChange(next)
  }

  const backToRoot = () => {
    if (actionLocked || isTransitioning) return
    gameAudio.playSe('cancel')
    setEscapeConfirmOpen(false)
    // App's command selector also clears Skill preview/arming for every non-fight value.
    // null is the root Battle command level; keep the public callback narrow until the
    // command state is moved into its own controller.
    onCommandChange(null as never)
  }

  const requestEscape = () => {
    if (actionLocked || isTransitioning || !escapeAllowed) return
    gameAudio.playSe('select')
    setEscapeConfirmOpen(true)
  }

  const confirmEscape = () => {
    if (actionLocked || isTransitioning || !escapeAllowed) return
    void runSceneTransition(
      'battle-return',
      () => {
        onRun()
        return navigate({ to: '/world' })
      },
      { label: '戦闘から離脱' },
    )
  }

  if (escapeConfirmOpen) {
    return (
      <div
        className="battle-escape-submenu"
        role="group"
        aria-label="逃走確認"
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return
          event.preventDefault()
          backToRoot()
        }}
      >
        <div className="battle-escape-confirm-copy">
          <strong>逃げますか？</strong>
          <span>この戦闘から離脱します。</span>
        </div>
        <button
          type="button"
          className="battle-command-button battle-escape-action"
          disabled={actionLocked || isTransitioning}
          onClick={confirmEscape}
        >
          逃げる
        </button>
        <button
          ref={escapeBackRef}
          type="button"
          className="battle-command-button battle-submenu-back"
          disabled={actionLocked || isTransitioning}
          onClick={backToRoot}
        >
          ← 戻る
        </button>
      </div>
    )
  }

  if (command !== null) {
    return (
      <div className="battle-command-bar battle-submenu-nav" role="group" aria-label="戦闘サブメニュー操作">
        <button
          type="button"
          className="battle-command-button battle-submenu-back"
          disabled={actionLocked || isTransitioning}
          onClick={backToRoot}
        >
          ← 戻る
        </button>
      </div>
    )
  }

  return (
    <div
      className="battle-command-bar battle-command-root"
      role="group"
      aria-label="戦闘コマンド"
      data-action-locked={actionLocked || isTransitioning}
      data-choice-count={escapeAllowed ? 3 : 2}
    >
      <button
        type="button"
        className="battle-command-button"
        disabled={actionLocked || isTransitioning}
        onClick={() => select('fight')}
      >
        戦う
      </button>
      <button
        type="button"
        className="battle-command-button"
        disabled={actionLocked || isTransitioning}
        onClick={() => select('items')}
      >
        アイテム
      </button>
      {escapeAllowed && (
        <button
          type="button"
          className="battle-command-button"
          disabled={actionLocked || isTransitioning}
          onClick={requestEscape}
          aria-label="逃げる"
        >
          逃げる
        </button>
      )}
    </div>
  )
}

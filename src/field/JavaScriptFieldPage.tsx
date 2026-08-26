import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { getDialogueForNpc } from '../dialogue/dialogue'
import { npcById } from '../dialogue/npcs'
import type { DialogueEntry, NpcDefinition } from '../dialogue/types'
import { battles } from '../game'
import { learningHintById, type LearningHint } from '../learning/learningHints'
import { useProgress } from '../progression'
import { getInteractionInFront, movePlayer, samePosition } from './field'
import { javascriptField } from './javascriptField'
import type { Direction, FieldInteraction, FieldPosition } from './types'

const createRunSeed = () => crypto.randomUUID()

const directionGlyph: Record<Direction, string> = {
  up: '▲',
  down: '▼',
  left: '◀',
  right: '▶',
}

type ActiveDialogue = {
  npc: NpcDefinition
  dialogue: DialogueEntry
  lineIndex: number
}

export function JavaScriptFieldPage() {
  const navigate = useNavigate()
  const { progress, stats } = useProgress()
  const [position, setPosition] = useState<FieldPosition>(javascriptField.start)
  const [facing, setFacing] = useState<Direction>('up')
  const [message, setMessage] = useState(
    '王国を歩き、NPCと話して次の目的を確認しよう。門の手前ではINTERACTでBattleへ入れる。',
  )
  const [activeDialogue, setActiveDialogue] = useState<ActiveDialogue | null>(null)
  const [activeLearningHint, setActiveLearningHint] = useState<LearningHint | null>(null)
  const overlayOpen = Boolean(activeDialogue || activeLearningHint)

  const battleByStageId = useMemo(
    () => new Map(battles.map((battle) => [battle.id, battle])),
    [],
  )

  const dialogueProgress = useMemo(
    () => ({
      level: stats.level,
      clearedStageIds: progress.clearedStageIds,
      clearedAreaIds: progress.clearedAreaIds,
    }),
    [progress.clearedAreaIds, progress.clearedStageIds, stats.level],
  )

  const describeInteraction = useCallback(
    (interaction: FieldInteraction) => {
      if (interaction.kind === 'sign') {
        if ('learningHintId' in interaction) {
          const hint = learningHintById[interaction.learningHintId]
          return hint
            ? `${hint.concept}の学習看板がある。ENTER / INTERACTで読む。`
            : '学習看板がある。'
        }
        return '看板がある。ENTER / INTERACTで読む。'
      }
      if (interaction.kind === 'exit') return `${interaction.label}への出口。ENTER / INTERACTで移動。`
      if (interaction.kind === 'npc') {
        const npc = npcById[interaction.npcId]
        return npc ? `${npc.name}がいる。ENTER / INTERACTで話す。` : '誰かがいる。'
      }

      const unlocked = progress.unlockedStageIds.includes(interaction.stageId)
      const battle = battleByStageId.get(interaction.stageId)
      if (!unlocked) return `STAGE ${interaction.stageId}はまだLOCKED。前のBattleをクリアしよう。`
      return `${battle?.title ?? interaction.label}へのBattle Gate。ENTER / INTERACTで挑戦。`
    },
    [battleByStageId, progress.unlockedStageIds],
  )

  const handleMove = useCallback(
    (direction: Direction) => {
      if (overlayOpen) return

      setFacing(direction)
      const next = movePlayer(javascriptField, position, direction)

      if (samePosition(next, position)) {
        const interaction = getInteractionInFront(javascriptField, position, direction)
        setMessage(interaction ? describeInteraction(interaction) : 'そこには進めない。')
      } else {
        setMessage('移動中… Gate・NPC・看板・出口の手前でINTERACT。')
      }

      setPosition(next)
    },
    [describeInteraction, overlayOpen, position],
  )

  const advanceDialogue = useCallback(() => {
    if (!activeDialogue) return

    if (activeDialogue.lineIndex < activeDialogue.dialogue.lines.length - 1) {
      setActiveDialogue({ ...activeDialogue, lineIndex: activeDialogue.lineIndex + 1 })
      return
    }

    setMessage(`${activeDialogue.npc.name}との会話を終えた。`)
    setActiveDialogue(null)
  }, [activeDialogue])

  const closeLearningHint = useCallback(() => {
    if (!activeLearningHint) return
    setMessage(`${activeLearningHint.concept}の説明を閉じた。必要なら何度でも看板を調べられる。`)
    setActiveLearningHint(null)
  }, [activeLearningHint])

  const handleInteract = useCallback(() => {
    if (activeDialogue) {
      advanceDialogue()
      return
    }

    if (activeLearningHint) {
      closeLearningHint()
      return
    }

    const interaction = getInteractionInFront(javascriptField, position, facing)

    if (!interaction) {
      setMessage('正面には調べられるものがない。')
      return
    }

    if (interaction.kind === 'sign') {
      if ('learningHintId' in interaction) {
        const hint = learningHintById[interaction.learningHintId]
        if (!hint) {
          setMessage('この学習看板のデータが見つからない。')
          return
        }
        setActiveLearningHint(hint)
        return
      }
      setMessage(interaction.message)
      return
    }

    if (interaction.kind === 'npc') {
      const npc = npcById[interaction.npcId]
      if (!npc) {
        setMessage('このNPCの会話データが見つからない。')
        return
      }

      setActiveDialogue({
        npc,
        dialogue: getDialogueForNpc(npc, dialogueProgress),
        lineIndex: 0,
      })
      return
    }

    if (interaction.kind === 'exit') {
      navigate({ to: '/javascript' })
      return
    }

    if (!progress.unlockedStageIds.includes(interaction.stageId)) {
      setMessage(`STAGE ${interaction.stageId}はLOCKED。前のBattleをクリアして解放しよう。`)
      return
    }

    navigate({
      to: '/javascript/battle/$battleId',
      params: { battleId: String(interaction.stageId) },
      search: { seed: createRunSeed(), returnTo: '/javascript/field' },
    })
  }, [
    activeDialogue,
    activeLearningHint,
    advanceDialogue,
    closeLearningHint,
    dialogueProgress,
    facing,
    navigate,
    position,
    progress.unlockedStageIds,
  ])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (activeDialogue) {
        if (event.key === 'Escape') {
          event.preventDefault()
          setActiveDialogue(null)
          return
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          advanceDialogue()
        }
        return
      }

      if (activeLearningHint) {
        if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          closeLearningHint()
        }
        return
      }

      const movement: Partial<Record<string, Direction>> = {
        ArrowUp: 'up',
        w: 'up',
        W: 'up',
        ArrowDown: 'down',
        s: 'down',
        S: 'down',
        ArrowLeft: 'left',
        a: 'left',
        A: 'left',
        ArrowRight: 'right',
        d: 'right',
        D: 'right',
      }

      const direction = movement[event.key]
      if (direction) {
        event.preventDefault()
        handleMove(direction)
        return
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleInteract()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeDialogue, activeLearningHint, advanceDialogue, closeLearningHint, handleInteract, handleMove])

  const cells = Array.from({ length: javascriptField.width * javascriptField.height }, (_, index) => ({
    x: index % javascriptField.width,
    y: Math.floor(index / javascriptField.width),
  }))

  return (
    <main className="app-shell field-shell title-screen">
      <section className="pixel-window field-panel">
        <header className="field-header">
          <div>
            <div className="eyebrow">WORLD 01 // JAVASCRIPT KINGDOM</div>
            <h1>Kingdom Hub</h1>
            <p>Gateへ向かう前にNPCや看板から、目的とコード読解のヒントを任意に確認できる。</p>
          </div>
          <div className="field-player-summary pixel-inner-window">
            <span>LV {stats.level}</span>
            <strong>HP {stats.maxHp}</strong>
          </div>
        </header>

        <div
          className="field-map pixel-inner-window"
          style={{ gridTemplateColumns: `repeat(${javascriptField.width}, minmax(0, 1fr))` }}
          aria-label="JavaScript Kingdom field map"
        >
          {cells.map((cell) => {
            const blocked = javascriptField.blockedTiles.some((tile) => samePosition(tile, cell))
            const border = cell.x === 0 || cell.y === 0 || cell.x === javascriptField.width - 1 || cell.y === javascriptField.height - 1
            const interaction = javascriptField.interactions.find((item) => samePosition(item, cell))
            const isPlayer = samePosition(position, cell)
            const battle = interaction?.kind === 'battle' ? battleByStageId.get(interaction.stageId) : undefined
            const npc = interaction?.kind === 'npc' ? npcById[interaction.npcId] : undefined
            const unlocked = interaction?.kind === 'battle'
              ? progress.unlockedStageIds.includes(interaction.stageId)
              : true
            const cleared = interaction?.kind === 'battle'
              ? progress.clearedStageIds.includes(interaction.stageId)
              : false

            return (
              <div
                key={`${cell.x}:${cell.y}`}
                className={`field-tile ${blocked ? (border ? 'field-wall' : 'field-rock') : ''} ${interaction ? `field-object field-object-${interaction.kind}` : ''} ${interaction?.kind === 'battle' && !unlocked ? 'is-locked' : ''} ${cleared ? 'is-cleared' : ''}`}
              >
                {interaction?.kind === 'battle' && (
                  <span className="field-gate-label">
                    {battle?.isBoss ? 'BOSS' : `ST${interaction.stageId}`}
                  </span>
                )}
                {interaction?.kind === 'npc' && (
                  <span className={`field-npc field-npc-${interaction.npcId}`} aria-label={npc?.name ?? 'NPC'}>
                    <span>{npc?.name.slice(0, 1) ?? 'N'}</span>
                  </span>
                )}
                {interaction?.kind === 'sign' && (
                  <span className="field-object-glyph">
                    {'learningHintId' in interaction ? 'JS' : '?'}
                  </span>
                )}
                {interaction?.kind === 'exit' && <span className="field-object-glyph">↩</span>}
                {isPlayer && (
                  <span className="field-player" aria-label={`Player facing ${facing}`}>
                    <span className="field-facing">{directionGlyph[facing]}</span>
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {activeDialogue ? (
          <section className="dialogue-window pixel-inner-window" aria-live="polite" aria-label="NPC dialogue">
            <div className="dialogue-speaker">
              <div>
                <span>{activeDialogue.npc.role}</span>
                <strong>{activeDialogue.npc.name}</strong>
              </div>
              <span className="dialogue-progress">
                {activeDialogue.lineIndex + 1}/{activeDialogue.dialogue.lines.length}
              </span>
            </div>
            <p>{activeDialogue.dialogue.lines[activeDialogue.lineIndex]}</p>
            <div className="dialogue-actions">
              <span>Enter / Space</span>
              <button className="primary-button" onClick={advanceDialogue}>
                {activeDialogue.lineIndex < activeDialogue.dialogue.lines.length - 1 ? '▶ NEXT' : '■ CLOSE'}
              </button>
            </div>
          </section>
        ) : activeLearningHint ? (
          <section className="learning-hint-window pixel-inner-window" aria-live="polite" aria-label="Learning hint">
            <div className="learning-hint-heading">
              <div>
                <span>FIELD NOTE // {activeLearningHint.concept}</span>
                <strong>{activeLearningHint.title}</strong>
              </div>
              <em>OPTIONAL HINT</em>
            </div>
            <p className="learning-hint-summary">{activeLearningHint.summary}</p>
            <pre className="learning-hint-code"><code>{activeLearningHint.codeLines.join('\n')}</code></pre>
            <div className="learning-hint-notes">
              {activeLearningHint.notes.map((note) => <p key={note}>• {note}</p>)}
            </div>
            <div className="learning-hint-actions">
              <span>Enter / Space / Esc</span>
              <button className="primary-button" onClick={closeLearningHint}>■ CLOSE</button>
            </div>
          </section>
        ) : (
          <section className="field-message pixel-inner-window" aria-live="polite">
            <span>FIELD LOG</span>
            <p>{message}</p>
          </section>
        )}

        <div className="field-controls" aria-label="Field controls">
          <div className="field-dpad">
            <button aria-label="Move up" disabled={overlayOpen} onClick={() => handleMove('up')}>▲</button>
            <button aria-label="Move left" disabled={overlayOpen} onClick={() => handleMove('left')}>◀</button>
            <button aria-label="Move down" disabled={overlayOpen} onClick={() => handleMove('down')}>▼</button>
            <button aria-label="Move right" disabled={overlayOpen} onClick={() => handleMove('right')}>▶</button>
          </div>
          <button className="primary-button field-interact" onClick={handleInteract}>
            {activeDialogue ? 'NEXT' : activeLearningHint ? 'CLOSE' : 'INTERACT'}
          </button>
          <button className="secondary-button" disabled={overlayOpen} onClick={() => navigate({ to: '/javascript' })}>
            STAGE SELECT
          </button>
        </div>

        <footer className="field-help">
          Keyboard: Arrow / WASD = MOVE · Enter / Space = INTERACT / NEXT · Mobile: D-PAD + INTERACT
        </footer>
      </section>
    </main>
  )
}

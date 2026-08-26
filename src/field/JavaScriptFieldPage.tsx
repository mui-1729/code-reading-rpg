import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { battles } from '../game'
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

export function JavaScriptFieldPage() {
  const navigate = useNavigate()
  const { progress, stats } = useProgress()
  const [position, setPosition] = useState<FieldPosition>(javascriptField.start)
  const [facing, setFacing] = useState<Direction>('up')
  const [message, setMessage] = useState(
    '王国を歩いてBattle Gateを探そう。門の手前でENTER / INTERACT。',
  )

  const battleByStageId = useMemo(
    () => new Map(battles.map((battle) => [battle.id, battle])),
    [],
  )

  const describeInteraction = useCallback(
    (interaction: FieldInteraction) => {
      if (interaction.kind === 'sign') return '看板がある。ENTER / INTERACTで読む。'
      if (interaction.kind === 'exit') return `${interaction.label}への出口。ENTER / INTERACTで移動。`

      const unlocked = progress.unlockedStageIds.includes(interaction.stageId)
      const battle = battleByStageId.get(interaction.stageId)
      if (!unlocked) return `STAGE ${interaction.stageId}はまだLOCKED。前のBattleをクリアしよう。`
      return `${battle?.title ?? interaction.label}へのBattle Gate。ENTER / INTERACTで挑戦。`
    },
    [battleByStageId, progress.unlockedStageIds],
  )

  const handleMove = useCallback(
    (direction: Direction) => {
      setFacing(direction)
      const next = movePlayer(javascriptField, position, direction)

      if (samePosition(next, position)) {
        const interaction = getInteractionInFront(javascriptField, position, direction)
        setMessage(interaction ? describeInteraction(interaction) : 'そこには進めない。')
      } else {
        setMessage('移動中… 門・看板・出口の手前でINTERACT。')
      }

      setPosition(next)
    },
    [describeInteraction, position],
  )

  const handleInteract = useCallback(() => {
    const interaction = getInteractionInFront(javascriptField, position, facing)

    if (!interaction) {
      setMessage('正面には調べられるものがない。')
      return
    }

    if (interaction.kind === 'sign') {
      setMessage(interaction.message)
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
  }, [facing, navigate, position, progress.unlockedStageIds])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
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
  }, [handleInteract, handleMove])

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
            <h1>Kingdom Field</h1>
            <p>歩いてBattle Gateを探し、コードリーディングの戦場へ入ろう。</p>
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
                {interaction?.kind === 'sign' && <span className="field-object-glyph">?</span>}
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

        <section className="field-message pixel-inner-window" aria-live="polite">
          <span>FIELD LOG</span>
          <p>{message}</p>
        </section>

        <div className="field-controls" aria-label="Field controls">
          <div className="field-dpad">
            <button aria-label="Move up" onClick={() => handleMove('up')}>▲</button>
            <button aria-label="Move left" onClick={() => handleMove('left')}>◀</button>
            <button aria-label="Move down" onClick={() => handleMove('down')}>▼</button>
            <button aria-label="Move right" onClick={() => handleMove('right')}>▶</button>
          </div>
          <button className="primary-button field-interact" onClick={handleInteract}>
            INTERACT
          </button>
          <button className="secondary-button" onClick={() => navigate({ to: '/javascript' })}>
            STAGE SELECT
          </button>
        </div>

        <footer className="field-help">
          Keyboard: Arrow / WASD = MOVE · Enter / Space = INTERACT · Mobile: D-PAD + INTERACT
        </footer>
      </section>
    </main>
  )
}

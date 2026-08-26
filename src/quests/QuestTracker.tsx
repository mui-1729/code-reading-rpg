import { useEffect, useMemo, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { JAVASCRIPT_AREA_ID, TYPESCRIPT_AREA_ID } from '../game/areas'
import { useProgress } from '../progression'
import { getMainQuestProgress, matchesQuestCondition } from './quests'

const visiblePaths = new Set([
  '/world',
  '/javascript',
  '/javascript/field',
  '/typescript',
  '/typescript/field',
])

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
}

export function QuestTracker() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { progress } = useProgress()
  const [open, setOpen] = useState(false)
  const visible = visiblePaths.has(pathname)

  const questProgress = useMemo(() => {
    const quests = getMainQuestProgress({
      clearedStageIds: progress.clearedStageIds,
      clearedAreaIds: progress.clearedAreaIds,
    })

    const preferredAreaId = pathname.startsWith('/typescript')
      ? TYPESCRIPT_AREA_ID
      : pathname.startsWith('/javascript')
        ? JAVASCRIPT_AREA_ID
        : null

    if (!preferredAreaId) return quests

    return [...quests].sort((left, right) => {
      if (left.quest.areaId === preferredAreaId) return -1
      if (right.quest.areaId === preferredAreaId) return 1
      return 0
    })
  }, [pathname, progress.clearedAreaIds, progress.clearedStageIds])

  useEffect(() => {
    if (!visible) setOpen(false)
  }, [visible])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!visible || isEditableTarget(event.target)) return

      if (event.key === 'Escape' && open) {
        event.preventDefault()
        setOpen(false)
        return
      }

      if (event.key.toLowerCase() === 'q' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, visible])

  if (!visible) return null

  const completeCount = questProgress.filter((quest) => quest.status === 'complete').length

  return (
    <aside className="quest-tracker" aria-label="Main quest tracker">
      <button
        className="quest-toggle pixel-window"
        type="button"
        aria-expanded={open}
        aria-controls="main-quest-panel"
        onClick={() => setOpen((current) => !current)}
      >
        <span>MAIN QUEST</span>
        <strong>{completeCount}/{questProgress.length} CLEAR</strong>
        <em>{open ? 'CLOSE' : 'OPEN · Q'}</em>
      </button>

      {open && (
        <section id="main-quest-panel" className="quest-panel pixel-window">
          <header className="quest-panel-header">
            <div>
              <span>QUEST LOG</span>
              <h2>MAIN OBJECTIVES</h2>
            </div>
            <button type="button" aria-label="Close quest log" onClick={() => setOpen(false)}>
              ×
            </button>
          </header>

          <div className="quest-list">
            {questProgress.map((entry) => {
              const nextStepId = entry.nextStep?.id

              return (
                <article
                  className={`quest-card quest-card-${entry.status}`}
                  key={entry.quest.id}
                >
                  <div className="quest-card-heading">
                    <div>
                      <span>{entry.quest.areaId.toUpperCase()}</span>
                      <h3>{entry.quest.title}</h3>
                    </div>
                    <strong>{entry.status.toUpperCase()}</strong>
                  </div>
                  <p>{entry.quest.description}</p>
                  <div className="quest-progress-line">
                    <span>{entry.completedSteps}/{entry.totalSteps} STEPS</span>
                    <div>
                      <i
                        style={{
                          width: `${entry.totalSteps === 0 ? 0 : (entry.completedSteps / entry.totalSteps) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <ol className="quest-steps">
                    {entry.quest.steps.map((step) => {
                      const complete = matchesQuestCondition(step.condition, {
                        clearedStageIds: progress.clearedStageIds,
                        clearedAreaIds: progress.clearedAreaIds,
                      })
                      const current = entry.status === 'active' && step.id === nextStepId

                      return (
                        <li
                          key={step.id}
                          className={`${complete ? 'is-complete' : ''} ${current ? 'is-current' : ''}`}
                        >
                          <span>{complete ? '✓' : current ? '▶' : '·'}</span>
                          <p>{step.label}</p>
                        </li>
                      )
                    })}
                  </ol>
                </article>
              )
            })}
          </div>

          <footer>Q = OPEN / CLOSE · Esc = CLOSE</footer>
        </section>
      )}
    </aside>
  )
}

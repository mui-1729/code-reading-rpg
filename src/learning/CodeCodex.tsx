import { useCallback, useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { gameAudio } from '../audio/gameAudio'
import { learningHints } from './learningHints'
import { typescriptLearningHints } from './typescriptLearningHints'

type CodexLanguage = 'javascript' | 'typescript'

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

const getPreferredLanguage = (pathname: string): CodexLanguage =>
  pathname.startsWith('/typescript') ? 'typescript' : 'javascript'

export function CodeCodex() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [open, setOpen] = useState(false)
  const [language, setLanguage] = useState<CodexLanguage>(() => getPreferredLanguage(pathname))
  const visible = visiblePaths.has(pathname)
  const hints = language === 'typescript' ? typescriptLearningHints : learningHints

  const toggle = useCallback(() => {
    gameAudio.playSe(open ? 'cancel' : 'confirm')
    if (!open) setLanguage(getPreferredLanguage(pathname))
    setOpen((current) => !current)
  }, [open, pathname])

  const close = useCallback(() => {
    if (!open) return
    gameAudio.playSe('cancel')
    setOpen(false)
  }, [open])

  const selectLanguage = (nextLanguage: CodexLanguage) => {
    if (nextLanguage === language) return
    gameAudio.playSe('select')
    setLanguage(nextLanguage)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!visible || isEditableTarget(event.target)) return

      if (event.key === 'Escape' && open) {
        event.preventDefault()
        close()
        return
      }

      if (event.key.toLowerCase() === 'c' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault()
        toggle()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [close, open, toggle, visible])

  if (!visible) return null

  return (
    <aside className="code-codex" aria-label="Code Codex">
      <button
        type="button"
        className="codex-toggle pixel-window"
        aria-expanded={open}
        aria-controls="code-codex-panel"
        onClick={toggle}
      >
        <span>CODEX</span>
        <strong>C</strong>
      </button>

      {open && (
        <div className="codex-overlay" onClick={close}>
          <section
            id="code-codex-panel"
            className="codex-panel pixel-window"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="codex-header">
              <h2>CODE CODEX</h2>
              <button type="button" aria-label="Close Code Codex" onClick={close}>×</button>
            </header>

            <div className="codex-tabs" role="tablist" aria-label="Codex language">
              <button
                type="button"
                role="tab"
                aria-selected={language === 'javascript'}
                className={language === 'javascript' ? 'is-active' : ''}
                onClick={() => selectLanguage('javascript')}
              >
                JAVASCRIPT
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={language === 'typescript'}
                className={language === 'typescript' ? 'is-active' : ''}
                onClick={() => selectLanguage('typescript')}
              >
                TYPESCRIPT
              </button>
            </div>

            <div className="codex-summary">
              <span>{language.toUpperCase()}</span>
              <strong>{hints.length} CONCEPTS</strong>
            </div>

            <div className="codex-grid">
              {hints.map((hint) => (
                <article className="codex-entry pixel-inner-window" key={hint.id}>
                  <div className="codex-entry-heading">
                    <span>{hint.concept}</span>
                    <strong>{hint.title}</strong>
                  </div>
                  <p>{hint.summary}</p>
                  <pre><code>{hint.codeLines.join('\n')}</code></pre>
                  <div className="codex-notes">
                    {hint.notes.map((note) => <p key={note}>• {note}</p>)}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </aside>
  )
}

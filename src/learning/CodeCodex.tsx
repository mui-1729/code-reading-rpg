import { useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { gameAudio } from '../audio/gameAudio'
import { learningHints } from './learningHints'
import { typescriptLearningHints } from './typescriptLearningHints'

type CodexLanguage = 'javascript' | 'typescript'

const getPreferredLanguage = (pathname: string): CodexLanguage =>
  pathname.startsWith('/typescript') ? 'typescript' : 'javascript'

export function CodeCodexContent() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [language, setLanguage] = useState<CodexLanguage>(() => getPreferredLanguage(pathname))
  const hints = language === 'typescript' ? typescriptLearningHints : learningHints

  const selectLanguage = (nextLanguage: CodexLanguage) => {
    if (nextLanguage === language) return
    gameAudio.playSe('select')
    setLanguage(nextLanguage)
  }

  return (
    <section className="pause-codex" aria-label="Code Codex">
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
  )
}

import { useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { gameAudio } from '../audio/gameAudio'
import { skills } from '../game'
import { useProgress } from '../progression'
import { learningHints } from './learningHints'
import { typescriptLearningHints } from './typescriptLearningHints'

type CodexLanguage = 'javascript' | 'typescript'

const getPreferredLanguage = (pathname: string): CodexLanguage =>
  pathname.startsWith('/typescript') ? 'typescript' : 'javascript'

const isSkillInLanguage = (skillId: string, language: CodexLanguage): boolean =>
  language === 'typescript' ? skillId.startsWith('ts-') : !skillId.startsWith('ts-')

export function CodeCodexContent() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { progress } = useProgress()
  const [language, setLanguage] = useState<CodexLanguage>(() => getPreferredLanguage(pathname))
  const hints = language === 'typescript' ? typescriptLearningHints : learningHints
  const masteredSkills = progress.unlockedSkillIds
    .filter((skillId) => isSkillInLanguage(skillId, language))
    .map((skillId) => skills[skillId]?.name ?? skillId)

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
        <strong>{hints.length} CONCEPTS · {masteredSkills.length} MASTERED</strong>
      </div>

      <div className="codex-notes pixel-inner-window" aria-label="Mastered skills">
        <p>
          <strong>MASTERED SKILLS</strong>
          {' · '}
          {masteredSkills.length > 0 ? masteredSkills.join(' / ') : 'NONE YET'}
        </p>
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

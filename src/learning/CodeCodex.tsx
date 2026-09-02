import { useRef, useState, type KeyboardEvent } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { gameAudio } from '../audio/gameAudio'
import { skills } from '../game'
import { useProgress } from '../progression'
import { useRpg } from '../rpg'
import { TS_FRONTIER_MAP_ID } from '../world/worldMap'
import { learningHints } from './learningHints'
import { typescriptLearningHints } from './typescriptLearningHints'

type CodexLanguage = 'javascript' | 'typescript'

const getPreferredLanguage = (pathname: string, worldMapId: string): CodexLanguage =>
  pathname.startsWith('/typescript') || (pathname === '/world' && worldMapId === TS_FRONTIER_MAP_ID)
    ? 'typescript'
    : 'javascript'

const isSkillInLanguage = (skillId: string, language: CodexLanguage): boolean =>
  language === 'typescript' ? skillId.startsWith('ts-') : !skillId.startsWith('ts-')

export function CodeCodexContent() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { progress } = useProgress()
  const { rpgState } = useRpg()
  const [language, setLanguage] = useState<CodexLanguage>(() => getPreferredLanguage(pathname, rpgState.worldMapId))
  const tabRefs = useRef<Record<CodexLanguage, HTMLButtonElement | null>>({
    javascript: null,
    typescript: null,
  })
  const hints = language === 'typescript' ? typescriptLearningHints : learningHints
  const masteredSkills = progress.unlockedSkillIds
    .filter((skillId) => isSkillInLanguage(skillId, language))
    .map((skillId) => skills[skillId]?.name ?? skillId)

  const selectLanguage = (nextLanguage: CodexLanguage) => {
    if (nextLanguage === language) return
    gameAudio.playSe('select')
    setLanguage(nextLanguage)
  }

  const moveLanguageTab = (event: KeyboardEvent<HTMLButtonElement>) => {
    const languages: CodexLanguage[] = ['javascript', 'typescript']
    const currentIndex = languages.indexOf(language)
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? languages.length - 1
        : event.key === 'ArrowRight'
          ? (currentIndex + 1) % languages.length
          : event.key === 'ArrowLeft'
            ? (currentIndex - 1 + languages.length) % languages.length
            : -1
    if (nextIndex < 0) return
    event.preventDefault()
    const nextLanguage = languages[nextIndex]
    selectLanguage(nextLanguage)
    queueMicrotask(() => tabRefs.current[nextLanguage]?.focus())
  }

  return (
    <section className="pause-codex" aria-label="Code Codex">
      <div className="codex-tabs" role="tablist" aria-label="Codex language">
        <button
          type="button"
          role="tab"
          id="codex-tab-javascript"
          tabIndex={language === 'javascript' ? 0 : -1}
          aria-controls="codex-language-panel"
          aria-selected={language === 'javascript'}
          className={language === 'javascript' ? 'is-active' : ''}
          ref={(element) => { tabRefs.current.javascript = element }}
          onClick={() => selectLanguage('javascript')}
          onKeyDown={moveLanguageTab}
        >
          JAVASCRIPT
        </button>
        <button
          type="button"
          role="tab"
          id="codex-tab-typescript"
          tabIndex={language === 'typescript' ? 0 : -1}
          aria-controls="codex-language-panel"
          aria-selected={language === 'typescript'}
          className={language === 'typescript' ? 'is-active' : ''}
          ref={(element) => { tabRefs.current.typescript = element }}
          onClick={() => selectLanguage('typescript')}
          onKeyDown={moveLanguageTab}
        >
          TYPESCRIPT
        </button>
      </div>

      <div className="codex-panel" id="codex-language-panel" role="tabpanel" tabIndex={0} aria-labelledby={`codex-tab-${language}`}>
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
      </div>
    </section>
  )
}

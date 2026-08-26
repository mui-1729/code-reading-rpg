import { useNavigate } from '@tanstack/react-router'
import { gameAudio } from '../audio/gameAudio'
import { useBgm } from '../audio/useBgm'
import { areas } from '../game'
import { useProgress } from '../progression'

export function WorldPage() {
  const navigate = useNavigate()
  const { progress, stats } = useProgress()
  useBgm('menu')

  const enterArea = (entryPath: '/javascript/field' | null) => {
    if (!entryPath) return
    gameAudio.playSe('confirm')
    navigate({ to: entryPath })
  }

  return (
    <main className="app-shell world-shell title-screen">
      <section className="pixel-window world-panel">
        <header className="world-header">
          <div>
            <div className="eyebrow">WORLD MAP // AREA SELECT</div>
            <h1>Choose the next region.</h1>
            <p>攻略済みAreaへ戻るか、次に解放される世界を確認できる。</p>
          </div>
          <div className="world-player pixel-inner-window">
            <span>CODE KNIGHT</span>
            <strong>LV {stats.level}</strong>
            <em>EXP {progress.exp}</em>
          </div>
        </header>

        <section className="world-grid" aria-label="World areas">
          {areas.map((area, index) => {
            const available = area.availability === 'available'
            const cleared = progress.clearedAreaIds.includes(area.id)

            return (
              <article
                key={area.id}
                className={`world-card pixel-inner-window ${available ? 'is-available' : 'is-coming-soon'} ${cleared ? 'is-cleared' : ''}`}
              >
                <div className="world-card-index">{String(index + 1).padStart(2, '0')}</div>
                <div className="world-card-topline">
                  <span>{area.label}</span>
                  <strong>{cleared ? 'AREA CLEAR' : available ? 'AVAILABLE' : 'COMING SOON'}</strong>
                </div>
                <div className="world-landmark" aria-hidden="true">
                  <span>{available ? '◆' : '◇'}</span>
                </div>
                <h2>{area.title}</h2>
                <p>{area.description}</p>
                <button
                  type="button"
                  className={available ? 'primary-button world-enter' : 'secondary-button world-enter'}
                  disabled={!available || !area.entryPath}
                  onClick={() => enterArea(area.entryPath)}
                >
                  {available ? (cleared ? '▶ REVISIT AREA' : '▶ ENTER AREA') : '■ LOCKED'}
                </button>
              </article>
            )
          })}
        </section>

        <footer className="world-footer">
          <span>各Areaは独立した学習テーマとBossを持つ。未実装Areaに進行データは作らない。</span>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              gameAudio.playSe('cancel')
              navigate({ to: '/' })
            }}
          >
            ◀ TITLE
          </button>
        </footer>
      </section>
    </main>
  )
}

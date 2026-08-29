import { useEffect, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { useProgress } from '../progression'
import { useRpg } from '../rpg'
import { WorldAtlas } from './WorldAtlas'

export function WorldAtlasOverlay() {
  const location = useLocation()
  const { progress } = useProgress()
  const { rpgState } = useRpg()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (location.pathname === '/') return null

  return (
    <>
      <button
        type="button"
        className="atlas-trigger secondary-button"
        onClick={() => setOpen(true)}
        aria-label="World mapを開く"
      >
        MAP
      </button>

      {open && (
        <div className="world-atlas-overlay" role="presentation" onClick={() => setOpen(false)}>
          <section
            className="world-atlas-dialog pixel-window"
            role="dialog"
            aria-modal="true"
            aria-label="World map"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="world-atlas-dialog-header">
              <div>
                <span className="eyebrow">NAVIGATION</span>
                <h2>WORLD MAP</h2>
              </div>
              <button
                className="close-button"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="World mapを閉じる"
              >
                ×
              </button>
            </header>
            <WorldAtlas rpgState={rpgState} progress={progress} />
          </section>
        </div>
      )}
    </>
  )
}

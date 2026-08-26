import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { gameAudio } from '../audio/gameAudio'
import { useProgress } from '../progression'
import { PATCH_KIT_HEAL, PATCH_KIT_PRICE, purchasePatchKit } from './economy'

const AREA_PATHS = new Set(['/javascript', '/typescript'])

export function AreaShop() {
  const { progress, setProgress } = useProgress()
  const [open, setOpen] = useState(false)
  const [, setRevision] = useState(0)
  const isAreaPage = typeof window !== 'undefined' && AREA_PATHS.has(window.location.pathname)
  const progressPanel = isAreaPage
    ? document.querySelector<HTMLElement>('.player-progress-panel')
    : null
  const headerActions = isAreaPage
    ? document.querySelector<HTMLElement>('.area-header-actions')
    : null

  useEffect(() => {
    let frame = 0
    let lastPath = window.location.pathname
    const observer = new MutationObserver(() => {
      if (frame !== 0) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        if (window.location.pathname !== lastPath) {
          lastPath = window.location.pathname
          setOpen(false)
        }
        setRevision((current) => current + 1)
      })
    })

    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      if (frame !== 0) window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (!isAreaPage) return null

  const handlePurchase = () => {
    const result = purchasePatchKit(progress)
    if (!result.purchased) {
      gameAudio.playSe('cancel')
      return
    }

    gameAudio.playSe('confirm')
    setProgress(result.progress)
  }

  const toggleShop = () => {
    gameAudio.playSe(open ? 'cancel' : 'confirm')
    setOpen((current) => !current)
  }

  return (
    <>
      {progressPanel && createPortal(
        <div className="progress-stat economy-progress-stat">
          <span>GOLD</span>
          <strong>{progress.gold} G</strong>
        </div>,
        progressPanel,
      )}

      {headerActions && createPortal(
        <button
          type="button"
          className="secondary-button area-shop-button"
          onClick={toggleShop}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          SHOP
        </button>,
        headerActions,
      )}

      {open && (
        <div className="overlay shop-overlay" onClick={() => setOpen(false)}>
          <section
            className="shop-panel pixel-window"
            role="dialog"
            aria-modal="true"
            aria-label="Shop"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="close-button"
              onClick={() => setOpen(false)}
              aria-label="ショップを閉じる"
            >
              ×
            </button>
            <div className="eyebrow">AREA SHOP</div>
            <h2>SUPPORT ITEMS</h2>

            <div className="shop-wallet pixel-inner-window">
              <span>GOLD</span>
              <strong>{progress.gold} G</strong>
            </div>

            <article className="shop-item pixel-inner-window">
              <div>
                <span className="shop-item-name">PATCH KIT</span>
                <strong>{PATCH_KIT_PRICE} G</strong>
              </div>
              <p>Battle中にHPを最大{PATCH_KIT_HEAL}回復。1Battleにつき1回使用可能。</p>
              <div className="shop-stock">OWNED ×{progress.inventory.patchKit}</div>
              <button
                type="button"
                className="primary-button"
                onClick={handlePurchase}
                disabled={progress.gold < PATCH_KIT_PRICE}
              >
                {progress.gold >= PATCH_KIT_PRICE ? '▶ BUY' : 'GOLD SHORTAGE'}
              </button>
            </article>
          </section>
        </div>
      )}
    </>
  )
}

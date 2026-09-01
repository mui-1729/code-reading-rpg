import { useEffect } from 'react'

function classifyWorldLog() {
  const viewport = document.querySelector<HTMLElement>('.world-viewport')
  const log = document.querySelector<HTMLElement>('.world-message')
  const message = log?.querySelector('p')?.textContent?.trim()
  if (!viewport || !log || !message) return

  const x = viewport.dataset.worldX
  const y = viewport.dataset.worldY
  if (x === undefined || y === undefined) return

  const tile = viewport.querySelector<HTMLElement>(
    `.world-tile[data-world-x="${x}"][data-world-y="${y}"]`,
  )
  const isAmbientTerrain = tile?.title?.trim() === message
  log.dataset.logPriority = isAmbientTerrain ? 'ambient' : 'event'
  log.setAttribute('aria-live', isAmbientTerrain ? 'off' : 'polite')
}

/**
 * WorldPage keeps domain/event messages in one small log. This presentation policy
 * suppresses the per-step terrain echo so exploration stays visually quiet and
 * screen readers only hear meaningful events such as blocks, transitions and rewards.
 */
export function WorldLogPolicy() {
  useEffect(() => {
    classifyWorldLog()
    const observer = new MutationObserver(classifyWorldLog)
    observer.observe(document.body, { subtree: true, childList: true, characterData: true })
    return () => observer.disconnect()
  }, [])

  return null
}

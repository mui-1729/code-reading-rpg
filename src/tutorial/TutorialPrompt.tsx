import { useEffect, useRef, useState } from 'react'
import { useTutorial } from './useTutorial'

type RouteKind = 'field' | 'battle' | 'other'

type TutorialCopy = {
  label: string
  title: string
  detail?: string
  className: string
}

const FIELD_PATHS = ['/world', '/javascript/field', '/typescript/field']
const BATTLE_PATH_PATTERN = /^\/(javascript|typescript)\/battle\/[^/]+$/

function getRouteKind(): RouteKind {
  const path = window.location.pathname
  if (FIELD_PATHS.includes(path)) return 'field'
  if (BATTLE_PATH_PATTERN.test(path)) return 'battle'
  return 'other'
}

function getFieldMap() {
  return document.querySelector<HTMLElement>('.world-viewport, .field-map')
}

function getFieldTiles() {
  const map = getFieldMap()
  if (!map) return []
  return Array.from(map.children).filter((child): child is HTMLElement =>
    child instanceof HTMLElement &&
    (child.classList.contains('field-tile') || child.classList.contains('world-tile')),
  )
}

function getPlayerTileIndex() {
  const tiles = getFieldTiles()
  return tiles.findIndex((tile) => tile.querySelector('.field-player, .world-player-sprite'))
}

function getPlayerPositionToken(): string | number | null {
  const worldPlayer = document.querySelector('.world-player-sprite')
  const worldTile = worldPlayer?.parentElement
  if (worldTile) {
    const x = worldTile.dataset.worldX
    const y = worldTile.dataset.worldY
    if (x !== undefined && y !== undefined) return `${x}:${y}`
  }

  const index = getPlayerTileIndex()
  return index >= 0 ? index : null
}

function getFieldWidth() {
  const map = getFieldMap()
  if (!map) return null
  if (map.classList.contains('world-viewport')) return 11
  const match = map.style.gridTemplateColumns.match(/repeat\((\d+)/)
  return match ? Number(match[1]) : null
}

function getFacingOffset(width: number) {
  const facing = document.querySelector('.field-facing')?.textContent?.trim()
  if (facing === '▲') return -width
  if (facing === '▼') return width
  if (facing === '◀') return -1
  if (facing === '▶') return 1
  return null
}

function hasInteractionNearby() {
  if (getRouteKind() !== 'field') return false
  if (document.querySelector('.dialogue-window, .learning-hint-window')) return false

  const map = getFieldMap()
  const width = getFieldWidth()
  const tiles = getFieldTiles()
  const playerIndex = getPlayerTileIndex()
  if (!map || !width || playerIndex < 0) return false

  if (map.classList.contains('world-viewport')) {
    const offsets = [-width, width, -1, 1]
    return offsets.some((offset) => {
      if (offset === -1 && playerIndex % width === 0) return false
      if (offset === 1 && playerIndex % width === width - 1) return false
      const targetIndex = playerIndex + offset
      return targetIndex >= 0 &&
        targetIndex < tiles.length &&
        Boolean(tiles[targetIndex]?.querySelector('.world-object'))
    })
  }

  const offset = getFacingOffset(width)
  if (offset === null) return false
  const targetIndex = playerIndex + offset
  if (targetIndex < 0 || targetIndex >= tiles.length) return false
  if (offset === -1 && playerIndex % width === 0) return false
  if (offset === 1 && playerIndex % width === width - 1) return false
  return tiles[targetIndex]?.classList.contains('field-object') ?? false
}

function clearHighlights() {
  document
    .querySelectorAll('.tutorial-highlight, .tutorial-highlight-soft')
    .forEach((element) => element.classList.remove('tutorial-highlight', 'tutorial-highlight-soft'))
}

export function TutorialPrompt() {
  const {
    state,
    completeFieldMove,
    completeFieldInteraction,
    enterBattle,
    completeBattle,
    skip,
  } = useTutorial()
  const [, setRevision] = useState(0)
  const initialPlayerPositionRef = useRef<string | number | null>(null)
  const routeKind = typeof window === 'undefined' ? 'other' : getRouteKind()
  const worldRoute = typeof window !== 'undefined' && window.location.pathname === '/world'
  const interactionReady = routeKind === 'field' && hasInteractionNearby()
  const selectedSkill =
    routeKind === 'battle'
      ? document.querySelector<HTMLButtonElement>('.skill-card.selected')
      : null
  const battleReady =
    routeKind === 'battle' &&
    !document.querySelector('.result-overlay, .modal-overlay') &&
    Boolean(document.querySelector('.skill-card:not(:disabled)'))

  useEffect(() => {
    let frame = 0
    const observer = new MutationObserver(() => {
      if (frame !== 0) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        setRevision((current) => current + 1)
      })
    })

    observer.observe(document.body, { childList: true, characterData: true, subtree: true })
    return () => {
      observer.disconnect()
      if (frame !== 0) window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    if (state.status !== 'active' || routeKind !== 'battle' || state.phase === 'battle') return
    enterBattle()
  }, [enterBattle, routeKind, state.phase, state.status])

  useEffect(() => {
    if (state.status !== 'active' || state.phase !== 'field-move' || routeKind !== 'field') {
      initialPlayerPositionRef.current = null
      return
    }

    const currentPosition = getPlayerPositionToken()
    if (currentPosition === null) return
    if (initialPlayerPositionRef.current === null) {
      initialPlayerPositionRef.current = currentPosition
      return
    }
    if (currentPosition !== initialPlayerPositionRef.current) {
      completeFieldMove()
      initialPlayerPositionRef.current = null
    }
  }, [completeFieldMove, routeKind, state.phase, state.status])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (state.status !== 'active') return
      const target = event.target
      if (!(target instanceof Element)) return

      if (
        state.phase === 'field-interact' &&
        target.closest('.field-interact, .world-interact') &&
        hasInteractionNearby()
      ) {
        completeFieldInteraction()
        return
      }

      if (state.phase !== 'battle') return
      const skillButton = target.closest<HTMLButtonElement>('.skill-card')
      if (!skillButton || skillButton.disabled) return
      if (skillButton.classList.contains('selected')) {
        completeBattle()
        return
      }
      window.requestAnimationFrame(() => setRevision((current) => current + 1))
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        state.status === 'active' &&
        state.phase === 'field-interact' &&
        (event.key === 'Enter' || event.key === ' ') &&
        hasInteractionNearby()
      ) {
        completeFieldInteraction()
      }
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [completeBattle, completeFieldInteraction, state.phase, state.status])

  useEffect(() => {
    clearHighlights()
    if (state.status !== 'active') return clearHighlights

    if (state.phase === 'field-move' && routeKind === 'field') {
      document.querySelector('.field-dpad, .world-dpad')?.classList.add('tutorial-highlight')
      document.querySelector('.field-player, .world-player-sprite')?.classList.add('tutorial-highlight-soft')
    } else if (state.phase === 'field-interact' && routeKind === 'field') {
      if (interactionReady) {
        document.querySelector('.field-interact, .world-interact')?.classList.add('tutorial-highlight')
      }
      if (worldRoute) {
        document.querySelector('.world-object')?.classList.add('tutorial-highlight-soft')
      }
    } else if (state.phase === 'battle' && routeKind === 'battle' && battleReady) {
      if (selectedSkill) selectedSkill.classList.add('tutorial-highlight')
      else document.querySelector('.skill-grid')?.classList.add('tutorial-highlight')
      document.querySelector('.floating-help')?.classList.add('tutorial-highlight-soft')
    }

    return clearHighlights
  }, [battleReady, interactionReady, routeKind, selectedSkill, state.phase, state.status, worldRoute])

  if (state.status !== 'active') return null

  const coarsePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  let copy: TutorialCopy | null = null

  if (state.phase === 'field-move' && routeKind === 'field') {
    copy = {
      label: 'MOVE',
      title: coarsePointer ? 'D-Padで歩いてみよう' : 'WASD / Arrowで歩いてみよう',
      className: 'tutorial-prompt-field',
    }
  } else if (state.phase === 'field-interact' && routeKind === 'field') {
    copy = interactionReady
      ? {
          label: 'INTERACT',
          title: coarsePointer ? 'INTERACTを押して調べる' : 'Enter / Spaceで調べる',
          className: 'tutorial-prompt-field',
        }
      : {
          label: 'INTERACT',
          title: worldRoute ? 'BYTE / SHOP / BOSSの隣まで歩こう' : '調べられるものの前まで歩こう',
          detail: '隣まで来るとINTERACTできる',
          className: 'tutorial-prompt-field',
        }
  } else if (state.phase === 'battle' && routeKind === 'battle' && battleReady) {
    copy = selectedSkill
      ? {
          label: 'EXECUTE',
          title: '選んだSkillをもう一度押して実行',
          detail: '別のSkillを選び直してもOK',
          className: 'tutorial-prompt-battle',
        }
      : {
          label: 'SELECT',
          title: 'コードを読んで、Skillを1枚選ぼう',
          detail: '困ったら右下の ? から CODE HELP を確認できる',
          className: 'tutorial-prompt-battle',
        }
  }

  if (!copy) return null

  return (
    <aside className={`tutorial-prompt pixel-window ${copy.className}`} aria-live="polite">
      <div className="tutorial-prompt-copy">
        <span>{copy.label}</span>
        <strong>{copy.title}</strong>
        {copy.detail && <small>{copy.detail}</small>}
      </div>
      <button type="button" className="tutorial-skip" onClick={skip}>SKIP</button>
    </aside>
  )
}

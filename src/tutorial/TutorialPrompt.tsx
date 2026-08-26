import { useEffect, useRef, useState } from 'react'
import { useTutorial } from './useTutorial'

type RouteKind = 'field' | 'battle' | 'other'

type TutorialCopy = {
  label: string
  title: string
  detail?: string
  className: string
}

const FIELD_PATHS = ['/javascript/field', '/typescript/field']
const BATTLE_PATH_PATTERN = /^\/(javascript|typescript)\/battle\/[^/]+$/

function getRouteKind(): RouteKind {
  const path = window.location.pathname
  if (FIELD_PATHS.includes(path)) return 'field'
  if (BATTLE_PATH_PATTERN.test(path)) return 'battle'
  return 'other'
}

function getFieldMap() {
  return document.querySelector<HTMLElement>('.field-map')
}

function getFieldTiles() {
  const map = getFieldMap()
  if (!map) return []
  return Array.from(map.children).filter((child): child is HTMLElement =>
    child instanceof HTMLElement && child.classList.contains('field-tile'),
  )
}

function getPlayerTileIndex() {
  const tiles = getFieldTiles()
  return tiles.findIndex((tile) => tile.querySelector('.field-player'))
}

function getFieldWidth() {
  const map = getFieldMap()
  if (!map) return null
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

function hasInteractionInFront() {
  if (getRouteKind() !== 'field') return false
  if (document.querySelector('.dialogue-window, .learning-hint-window')) return false

  const width = getFieldWidth()
  const tiles = getFieldTiles()
  const playerIndex = getPlayerTileIndex()
  if (!width || playerIndex < 0) return false

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
  const initialPlayerTileRef = useRef<number | null>(null)
  const routeKind = typeof window === 'undefined' ? 'other' : getRouteKind()
  const interactionReady = routeKind === 'field' && hasInteractionInFront()
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

    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    })
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
      initialPlayerTileRef.current = null
      return
    }

    const currentIndex = getPlayerTileIndex()
    if (currentIndex < 0) return

    if (initialPlayerTileRef.current === null) {
      initialPlayerTileRef.current = currentIndex
      return
    }

    if (currentIndex !== initialPlayerTileRef.current) {
      completeFieldMove()
      initialPlayerTileRef.current = null
    }
  }, [completeFieldMove, routeKind, state.phase, state.status])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (state.status !== 'active') return
      const target = event.target
      if (!(target instanceof Element)) return

      if (
        state.phase === 'field-interact' &&
        target.closest('.field-interact') &&
        hasInteractionInFront()
      ) {
        completeFieldInteraction()
        return
      }

      if (state.phase !== 'battle') return
      const skillButton = target.closest<HTMLButtonElement>('.skill-card')
      if (!skillButton || skillButton.disabled) return

      // Capture phaseでReactのonClickより先に現在の選択状態を読む。
      // これにより1回目のclickをSELECT、選択済みcardの2回目だけをEXECUTEとして扱える。
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
        hasInteractionInFront()
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
      document.querySelector('.field-dpad')?.classList.add('tutorial-highlight')
      document.querySelector('.field-player')?.classList.add('tutorial-highlight-soft')
    } else if (
      state.phase === 'field-interact' &&
      routeKind === 'field' &&
      interactionReady
    ) {
      document.querySelector('.field-interact')?.classList.add('tutorial-highlight')
    } else if (state.phase === 'battle' && routeKind === 'battle' && battleReady) {
      if (selectedSkill) selectedSkill.classList.add('tutorial-highlight')
      else document.querySelector('.skill-grid')?.classList.add('tutorial-highlight')
      document.querySelector('.floating-help')?.classList.add('tutorial-highlight-soft')
    }

    return clearHighlights
  }, [battleReady, interactionReady, routeKind, selectedSkill, state.phase, state.status])

  if (state.status !== 'active') return null

  const coarsePointer =
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  let copy: TutorialCopy | null = null

  if (state.phase === 'field-move' && routeKind === 'field') {
    copy = {
      label: 'MOVE',
      title: coarsePointer ? 'D-Padで歩いてみよう' : 'WASD / Arrowで歩いてみよう',
      className: 'tutorial-prompt-field',
    }
  } else if (state.phase === 'field-interact' && routeKind === 'field' && interactionReady) {
    copy = {
      label: 'INTERACT',
      title: coarsePointer ? 'INTERACTを押して調べる' : 'Enter / Spaceで調べる',
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
      <button type="button" className="tutorial-skip" onClick={skip}>
        SKIP
      </button>
    </aside>
  )
}

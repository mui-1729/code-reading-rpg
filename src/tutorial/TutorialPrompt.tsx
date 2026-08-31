import { useEffect, useRef, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { useBattleRuntime } from '../battle/BattleRuntimeContext'
import { areas, parseBattleRoute } from '../game/areas'
import { useRpg } from '../rpg'
import { useTutorial } from './useTutorial'

type RouteKind = 'field' | 'battle' | 'other'

type TutorialCopy = {
  label: string
  title: string
  detail?: string
  className: string
}

const FIELD_PATHS = ['/world', ...areas.map((area) => area.routes.field)]

function getRouteKind(path = window.location.pathname): RouteKind {
  if (FIELD_PATHS.includes(path)) return 'field'
  if (parseBattleRoute(path)?.area.capabilities.tutorial) return 'battle'
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

function getWorldPlayerPosition() {
  const worldPlayer = document.querySelector<HTMLElement>('.world-player-sprite')
  if (!worldPlayer) return null

  const x = Number(worldPlayer.dataset.worldX ?? worldPlayer.parentElement?.dataset.worldX)
  const y = Number(worldPlayer.dataset.worldY ?? worldPlayer.parentElement?.dataset.worldY)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return { x, y }
}

function getPlayerPositionToken(): string | number | null {
  const worldPosition = getWorldPlayerPosition()
  if (worldPosition) return `${worldPosition.x}:${worldPosition.y}`

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
  if (!map || !width) return false

  if (map.classList.contains('world-viewport')) {
    const player = getWorldPlayerPosition()
    if (!player) return false

    return tiles.some((tile) => {
      const x = Number(tile.dataset.worldX)
      const y = Number(tile.dataset.worldY)
      if (!Number.isFinite(x) || !Number.isFinite(y)) return false
      const adjacent = Math.abs(x - player.x) + Math.abs(y - player.y) === 1
      return adjacent && Boolean(tile.querySelector('.world-object'))
    })
  }

  const playerIndex = getPlayerTileIndex()
  if (playerIndex < 0) return false
  const offset = getFacingOffset(width)
  if (offset === null) return false
  const targetIndex = playerIndex + offset
  if (targetIndex < 0 || targetIndex >= tiles.length) return false
  if (offset === -1 && playerIndex % width === 0) return false
  if (offset === 1 && playerIndex % width === width - 1) return false
  return tiles[targetIndex]?.classList.contains('field-object') ?? false
}

function hasByteNearby() {
  const map = getFieldMap()
  if (!map?.classList.contains('world-viewport')) return false
  const player = getWorldPlayerPosition()
  if (!player) return false

  return getFieldTiles().some((tile) => {
    const x = Number(tile.dataset.worldX)
    const y = Number(tile.dataset.worldY)
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false
    const adjacent = Math.abs(x - player.x) + Math.abs(y - player.y) === 1
    return adjacent && Boolean(tile.querySelector('.npc-object[aria-label="BYTE NPC"]'))
  })
}

function clearHighlights() {
  document
    .querySelectorAll('.tutorial-highlight, .tutorial-highlight-soft')
    .forEach((element) => element.classList.remove('tutorial-highlight', 'tutorial-highlight-soft'))
}

export function TutorialPrompt() {
  const pathname = useRouterState({ select: (router) => router.location.pathname })
  const { snapshot: battleRuntime } = useBattleRuntime()
  const { rpgState } = useRpg()
  const {
    state,
    completeFieldMove,
    completeFieldInteraction,
    enterBattle,
    completeBattle,
    skip,
  } = useTutorial()
  const [revision, setRevision] = useState(0)
  const initialPlayerPositionRef = useRef<string | number | null>(null)
  const routeKind = getRouteKind(pathname)
  const worldRoute = pathname === '/world'
  const byteJoined = rpgState.partyMemberIds.includes('byte')
  const interactionReady =
    routeKind === 'field' &&
    (worldRoute ? byteJoined || hasByteNearby() : hasInteractionNearby())
  const selectedSkillId = routeKind === 'battle' ? battleRuntime?.selectedSkillId : null
  const battleReady =
    routeKind === 'battle' &&
    battleRuntime?.phase === 'battle' &&
    !battleRuntime.isModalOpen &&
    !battleRuntime.isResolving

  useEffect(() => {
    if (routeKind !== 'field') return
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
      attributes: true,
      attributeFilter: ['data-world-x', 'data-world-y'],
    })
    return () => {
      observer.disconnect()
      if (frame !== 0) window.cancelAnimationFrame(frame)
    }
  }, [routeKind])

  useEffect(() => {
    if (state.status !== 'active' || routeKind !== 'battle' || state.phase === 'battle') return
    enterBattle()
  }, [enterBattle, routeKind, state.phase, state.status])

  useEffect(() => {
    if (state.status === 'active' && state.phase === 'battle' && battleRuntime?.isResolving) {
      completeBattle()
    }
  }, [battleRuntime?.isResolving, completeBattle, state.phase, state.status])

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
  }, [completeFieldMove, revision, routeKind, state.phase, state.status])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (state.status !== 'active') return
      const target = event.target
      if (!(target instanceof Element)) return

      if (
        state.phase === 'field-interact' &&
        target.closest('.field-interact, .world-interact') &&
        interactionReady
      ) {
        if (!worldRoute) completeFieldInteraction()
        return
      }

    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        state.status === 'active' &&
        state.phase === 'field-interact' &&
        (event.key === 'Enter' || event.key === ' ') &&
        interactionReady &&
        !worldRoute
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
  }, [completeFieldInteraction, interactionReady, state.phase, state.status, worldRoute])

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
        if (byteJoined) {
          document.querySelector('.world-follower-sprite')?.classList.add('tutorial-highlight-soft')
        } else {
          document
            .querySelector('.npc-object[aria-label="BYTE NPC"]')
            ?.classList.add('tutorial-highlight-soft')
        }
      }
    } else if (state.phase === 'party-join' && routeKind === 'field') {
      document.querySelector('.world-follower-sprite')?.classList.add('tutorial-highlight-soft')
    } else if (state.phase === 'battle' && routeKind === 'battle' && battleReady) {
      // The DOM is only the highlight destination; selection comes from Battle runtime state.
      const selectedSkill = selectedSkillId
        ? document.querySelector<HTMLElement>(`[data-skill-id="${CSS.escape(selectedSkillId)}"]`)
        : null
      if (selectedSkill) selectedSkill.classList.add('tutorial-highlight')
      else document.querySelector('.skill-grid')?.classList.add('tutorial-highlight')
      document.querySelector('.floating-help')?.classList.add('tutorial-highlight-soft')
    }

    return clearHighlights
  }, [battleReady, byteJoined, interactionReady, routeKind, selectedSkillId, state.phase, state.status, worldRoute])

  if (state.status !== 'active') return null

  const coarsePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  let copy: TutorialCopy | null = null

  if (state.phase === 'field-move' && routeKind === 'field') {
    copy = {
      label: 'MOVE',
      title: byteJoined
        ? coarsePointer
          ? 'D-Padで1歩動いて操作を確認しよう'
          : 'WASD / Arrowで1歩動いて操作を確認しよう'
        : coarsePointer
          ? 'D-PadでBYTEの近くへ歩こう'
          : 'WASD / ArrowでBYTEの近くへ歩こう',
      detail: byteJoined
        ? 'BYTEは加入済み。移動のあとINTERACTももう一度確認する'
        : '開始地点から左か上へ1歩でBYTEの隣へ行ける',
      className: 'tutorial-prompt-field',
    }
  } else if (state.phase === 'field-interact' && routeKind === 'field') {
    copy = interactionReady
      ? {
          label: 'INTERACT',
          title: byteJoined
            ? coarsePointer
              ? 'INTERACTで加入済みBYTEに声をかける'
              : 'Enter / Spaceで加入済みBYTEに声をかける'
            : coarsePointer
              ? 'INTERACTでBYTEに話しかける'
              : 'Enter / SpaceでBYTEに話しかける',
          detail: byteJoined ? '再加入はせず、Party操作だけ確認する' : '実際にPartyへ加入させよう',
          className: 'tutorial-prompt-field',
        }
      : {
          label: 'INTERACT',
          title: worldRoute ? 'BYTEの隣まで歩こう' : '調べられるものの前まで歩こう',
          detail: 'BYTEの隣まで来るとINTERACTできる',
          className: 'tutorial-prompt-field',
        }
  } else if (state.phase === 'party-join' && routeKind === 'field') {
    copy = {
      label: 'PARTY',
      title: byteJoined ? 'BYTE joined! 仲間になった' : 'BYTEをPartyへ加入させよう',
      detail: byteJoined
        ? 'Worldでは後ろから追従する。PauseのPARTYで確認でき、Battleではあなたが読んだ同じtargetへ追撃する。'
        : 'BYTEの隣でINTERACTしてPartyへ加入させる',
      className: 'tutorial-prompt-field',
    }
  } else if (state.phase === 'battle' && routeKind === 'battle' && battleReady) {
    copy = selectedSkillId
      ? {
          label: 'EXECUTE',
          title: '選んだSkillをもう一度押して実行',
          detail: 'BYTEは答えを選ばず、あなたが読んだ同じtargetへ追撃する',
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
      {state.phase === 'party-join' && byteJoined && (
        <button type="button" className="tutorial-skip" onClick={enterBattle}>NEXT · BATTLE</button>
      )}
      <button type="button" className="tutorial-skip" onClick={skip}>SKIP</button>
    </aside>
  )
}

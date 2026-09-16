import { useCallback, useEffect } from 'react'
import { useProgress } from '../progression'
import { useRpg } from '../rpg'
import { router } from '../router'
import { resolveWorldMove } from '../world/worldActions'
import { getWorldInteractionTarget } from '../world/worldInteractionTarget'
import type { WorldFacing } from '../world/worldPresentation'
import { TS_FRONTIER_MAP_ID } from '../world/worldMap'
import { resolveWorldTargetInteraction } from '../world/worldTargetInteraction'
import { useSceneTransition } from './useSceneTransition'

type Direction = { dx: number; dy: number }

const DIRECTION_BY_LABEL: Record<string, Direction> = {
  '上へ移動': { dx: 0, dy: -1 },
  '下へ移動': { dx: 0, dy: 1 },
  '左へ移動': { dx: -1, dy: 0 },
  '右へ移動': { dx: 1, dy: 0 },
}

function getRenderedWorldFacing(): WorldFacing | null {
  const facing = document.querySelector<HTMLElement>('.world-player-sprite')?.dataset.facing
  return facing === 'up' || facing === 'down' || facing === 'left' || facing === 'right'
    ? facing
    : null
}

function getDirectionButton(target: EventTarget | null) {
  if (!(target instanceof Element)) return null
  const button = target.closest<HTMLButtonElement>('.world-dpad button[aria-label]')
  if (!button) return null
  const label = button.getAttribute('aria-label') ?? ''
  const direction = DIRECTION_BY_LABEL[label]
  return direction ? { button, direction } : null
}

function getKeyboardDirection(key: string): Direction | null {
  const normalized = key.toLowerCase()
  if (normalized === 'arrowup' || normalized === 'w') return { dx: 0, dy: -1 }
  if (normalized === 'arrowdown' || normalized === 's') return { dx: 0, dy: 1 }
  if (normalized === 'arrowleft' || normalized === 'a') return { dx: -1, dy: 0 }
  if (normalized === 'arrowright' || normalized === 'd') return { dx: 1, dy: 0 }
  return null
}

function stopNativeEvent(event: Event) {
  if (event.cancelable) event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
}

export function WorldBattleTransitionGate() {
  const { progress } = useProgress()
  const { rpgState, setRpgState } = useRpg()
  const { isTransitioning, runSceneTransition } = useSceneTransition()

  const startBattle = useCallback((
    battleId: number,
    region: 'javascript' | 'typescript',
    seed: string,
    kind: 'battle-start' | 'boss-start',
  ) => {
    void runSceneTransition(kind, () => router.navigate({
      to: region === 'javascript'
        ? '/javascript/battle/$battleId'
        : '/typescript/battle/$battleId',
      params: { battleId: String(battleId) },
      search: { seed, returnTo: '/world' },
    }), { label: kind === 'boss-start' ? 'BOSS BATTLE' : 'BATTLE' })
  }, [runSceneTransition])

  const startFacedBattle = useCallback(() => {
    // TypeScriptFrontierPage owns its battle-entry transition directly so this
    // global gate only fills the JavaScript World routes that still use the
    // legacy immediate enterBattle helper.
    if (rpgState.worldMapId === TS_FRONTIER_MAP_ID) return false

    const facing = getRenderedWorldFacing()
    if (!facing) return false
    const target = getWorldInteractionTarget(rpgState.worldPosition, facing)
    const intent = resolveWorldTargetInteraction(rpgState, progress, target)

    if (intent.kind === 'training' && intent.battleId !== null) {
      startBattle(intent.battleId, 'javascript', `village-training:${intent.battleId}`, 'battle-start')
      return true
    }
    if (intent.kind === 'midboss' && intent.unlocked) {
      startBattle(intent.battleId, intent.region, intent.seed, 'boss-start')
      return true
    }
    if (intent.kind === 'boss' && intent.unlocked) {
      startBattle(intent.battleId, intent.region, intent.seed, 'boss-start')
      return true
    }
    return false
  }, [progress, rpgState, startBattle])

  const startFixedMoveBattle = useCallback((direction: Direction) => {
    if (rpgState.worldMapId === TS_FRONTIER_MAP_ID) return false

    const result = resolveWorldMove({
      rpgState,
      progress,
      dx: direction.dx,
      dy: direction.dy,
    })
    if (result.kind !== 'encounter') return false

    // Random encounters are review Battles selected from already-cleared stages.
    // An uncleared Battle returned by movement is therefore a fixed Story /
    // learning encounter and should use the deliberate battle-start grammar,
    // not the surprise `!` cue reserved for Random encounters.
    if (progress.clearedStageIds.includes(result.battle.battleId)) return false

    setRpgState(result.nextState)
    startBattle(
      result.battle.battleId,
      result.battle.region,
      result.battle.seed,
      'battle-start',
    )
    return true
  }, [progress, rpgState, setRpgState, startBattle])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (isTransitioning || event.button !== 0) return
      const control = getDirectionButton(event.target)
      if (!control || !startFixedMoveBattle(control.direction)) return
      stopNativeEvent(event)
    }

    const onClick = (event: MouseEvent) => {
      if (isTransitioning) return

      const directionControl = getDirectionButton(event.target)
      if (
        directionControl &&
        event.detail === 0 &&
        startFixedMoveBattle(directionControl.direction)
      ) {
        stopNativeEvent(event)
        return
      }

      if (!(event.target instanceof Element)) return
      if (!event.target.closest('.world-interact')) return
      if (!startFacedBattle()) return
      stopNativeEvent(event)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTransitioning) return
      const target = event.target
      const nativeControl = target instanceof Element &&
        (event.key === 'Enter' || event.key === ' ') &&
        Boolean(target.closest('button, a'))
      if (nativeControl) return

      const direction = getKeyboardDirection(event.key)
      if (direction && startFixedMoveBattle(direction)) {
        stopNativeEvent(event)
        return
      }

      if (event.key !== 'Enter' && event.key !== ' ') return
      if (!startFacedBattle()) return
      stopNativeEvent(event)
    }

    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('click', onClick, true)
    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('click', onClick, true)
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [isTransitioning, startFacedBattle, startFixedMoveBattle])

  return null
}

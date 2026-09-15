import { useCallback, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useProgress } from '../progression'
import { useRpg } from '../rpg'
import { getWorldInteractionTarget } from '../world/worldInteractionTarget'
import type { WorldFacing } from '../world/worldPresentation'
import { TS_FRONTIER_MAP_ID } from '../world/worldMap'
import { resolveWorldTargetInteraction } from '../world/worldTargetInteraction'
import { useSceneTransition } from './useSceneTransition'

function getRenderedWorldFacing(): WorldFacing | null {
  const facing = document.querySelector<HTMLElement>('.world-player-sprite')?.dataset.facing
  return facing === 'up' || facing === 'down' || facing === 'left' || facing === 'right'
    ? facing
    : null
}

function stopNativeEvent(event: Event) {
  if (event.cancelable) event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
}

export function WorldBattleTransitionGate() {
  const navigate = useNavigate()
  const { progress } = useProgress()
  const { rpgState } = useRpg()
  const { isTransitioning, runSceneTransition } = useSceneTransition()

  const startFacedBattle = useCallback(() => {
    // TypeScriptFrontierPage owns its battle-entry transition directly so this
    // global gate only fills the JavaScript World routes that still use the
    // legacy immediate enterBattle helper.
    if (rpgState.worldMapId === TS_FRONTIER_MAP_ID) return false

    const facing = getRenderedWorldFacing()
    if (!facing) return false
    const target = getWorldInteractionTarget(rpgState.worldPosition, facing)
    const intent = resolveWorldTargetInteraction(rpgState, progress, target)

    let battleId: number
    let region: 'javascript' | 'typescript'
    let seed: string
    let kind: 'battle-start' | 'boss-start'

    if (intent.kind === 'training' && intent.battleId !== null) {
      battleId = intent.battleId
      region = 'javascript'
      seed = `village-training:${intent.battleId}`
      kind = 'battle-start'
    } else if (intent.kind === 'midboss' && intent.unlocked) {
      battleId = intent.battleId
      region = intent.region
      seed = intent.seed
      kind = 'boss-start'
    } else if (intent.kind === 'boss' && intent.unlocked) {
      battleId = intent.battleId
      region = intent.region
      seed = intent.seed
      kind = 'boss-start'
    } else {
      return false
    }

    void runSceneTransition(kind, () => navigate({
      to: region === 'javascript'
        ? '/javascript/battle/$battleId'
        : '/typescript/battle/$battleId',
      params: { battleId: String(battleId) },
      search: { seed, returnTo: '/world' },
    }), { label: kind === 'boss-start' ? 'BOSS BATTLE' : 'BATTLE' })
    return true
  }, [navigate, progress, rpgState, runSceneTransition])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (isTransitioning) return
      if (!(event.target instanceof Element)) return
      if (!event.target.closest('.world-interact')) return
      if (!startFacedBattle()) return
      stopNativeEvent(event)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTransitioning || (event.key !== 'Enter' && event.key !== ' ')) return
      const target = event.target
      const nativeControl = target instanceof Element && Boolean(target.closest('button, a'))
      if (nativeControl) return
      if (!startFacedBattle()) return
      stopNativeEvent(event)
    }

    window.addEventListener('click', onClick, true)
    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.removeEventListener('click', onClick, true)
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [isTransitioning, startFacedBattle])

  return null
}

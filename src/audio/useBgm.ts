import { useEffect } from 'react'
import {
  WORLD_SCENE_EVENT,
  type WorldSceneEventDetail,
  type WorldFieldTrack,
} from '../world/worldPresentation'
import { gameAudio, type BgmTrack } from './gameAudio'

function getMountedWorldTrack(): WorldFieldTrack | null {
  if (typeof document === 'undefined') return null
  const track = document.querySelector<HTMLElement>('[data-world-bgm-track]')?.dataset.worldBgmTrack
  if (
    track === 'field' ||
    track === 'fieldVillage' ||
    track === 'fieldForest' ||
    track === 'fieldDeepForest' ||
    track === 'fieldTypeScript'
  ) {
    return track
  }
  return null
}

export function useBgm(track: BgmTrack): void {
  useEffect(() => {
    let activeTrack: BgmTrack = track === 'field' ? getMountedWorldTrack() ?? track : track
    gameAudio.requestBgm(activeTrack)

    if (track !== 'field' || typeof window === 'undefined') {
      return () => gameAudio.releaseBgm(activeTrack)
    }

    const handleWorldScene = (event: Event) => {
      const nextTrack = (event as CustomEvent<WorldSceneEventDetail>).detail?.bgmTrack
      if (!nextTrack || nextTrack === activeTrack) return
      const previousTrack = activeTrack
      activeTrack = nextTrack
      gameAudio.requestBgm(nextTrack)
      gameAudio.releaseBgm(previousTrack)
    }

    window.addEventListener(WORLD_SCENE_EVENT, handleWorldScene)
    return () => {
      window.removeEventListener(WORLD_SCENE_EVENT, handleWorldScene)
      gameAudio.releaseBgm(activeTrack)
    }
  }, [track])
}

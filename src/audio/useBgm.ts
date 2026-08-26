import { useEffect } from 'react'
import { gameAudio, type BgmTrack } from './gameAudio'

export function useBgm(track: BgmTrack): void {
  useEffect(() => {
    gameAudio.requestBgm(track)
    return () => gameAudio.releaseBgm(track)
  }, [track])
}

import { RouterProvider } from '@tanstack/react-router'
import { BattleRuntimeProvider } from './battle/BattleRuntimeProvider'
import { GameStateProvider } from './persistence'
import { router } from './router'
import { SceneTransitionProvider } from './transition/SceneTransitionContext'
import { TutorialProvider } from './tutorial'
import { WorldCharacterDecorations } from './world/WorldCharacterDecorations'
import { WorldMapTransitionGate } from './world/WorldMapTransitionGate'
import { VillageFacilities } from './world/VillageFacilities'
import { WorldRecoveryStops } from './world/WorldRecoveryStops'

export function AppRouter() {
  return (
    <GameStateProvider>
      <TutorialProvider>
        <BattleRuntimeProvider>
          <SceneTransitionProvider>
            <RouterProvider router={router} />
            <WorldMapTransitionGate />
            <WorldCharacterDecorations />
            <VillageFacilities />
            <WorldRecoveryStops />
          </SceneTransitionProvider>
        </BattleRuntimeProvider>
      </TutorialProvider>
    </GameStateProvider>
  )
}

import { RouterProvider } from '@tanstack/react-router'
import { BattleRuntimeProvider } from './battle/BattleRuntimeProvider'
import { GameStateProvider } from './persistence'
import { router } from './router'
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
          <RouterProvider router={router} />
          <WorldMapTransitionGate />
          <WorldCharacterDecorations />
          <VillageFacilities />
          <WorldRecoveryStops />
        </BattleRuntimeProvider>
      </TutorialProvider>
    </GameStateProvider>
  )
}

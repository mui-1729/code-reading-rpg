import { RouterProvider } from '@tanstack/react-router'
import { BattleRuntimeProvider } from './battle/BattleRuntimeProvider'
import { GameStateProvider } from './persistence'
import { router } from './router'
import { TutorialProvider } from './tutorial'
import { WorldCharacterDecorations } from './world/WorldCharacterDecorations'
import { VillageFacilities } from './world/VillageFacilities'
import { WorldRecoveryStops } from './world/WorldRecoveryStops'
import { TypeScriptRegionGate } from './world/TypeScriptRegionGate'

export function AppRouter() {
  return (
    <GameStateProvider>
      <TutorialProvider>
        <BattleRuntimeProvider>
          <RouterProvider router={router} />
          <WorldCharacterDecorations />
          <VillageFacilities />
          <WorldRecoveryStops />
          <TypeScriptRegionGate />
        </BattleRuntimeProvider>
      </TutorialProvider>
    </GameStateProvider>
  )
}

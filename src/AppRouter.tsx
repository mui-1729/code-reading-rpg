import { RouterProvider } from '@tanstack/react-router'
import { BattleRuntimeProvider } from './battle/BattleRuntimeProvider'
import { GameStateProvider } from './persistence'
import { router } from './router'
import { BattleResultTransitionGate } from './transition/BattleResultTransitionGate'
import { HomeSceneTransitionGate } from './transition/HomeSceneTransitionGate'
import { SceneTransitionProvider } from './transition/SceneTransitionContext'
import { WorldBattleTransitionGate } from './transition/WorldBattleTransitionGate'
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
            <HomeSceneTransitionGate />
            <BattleResultTransitionGate />
            <WorldMapTransitionGate />
            <WorldBattleTransitionGate />
            <WorldCharacterDecorations />
            <VillageFacilities />
            <WorldRecoveryStops />
          </SceneTransitionProvider>
        </BattleRuntimeProvider>
      </TutorialProvider>
    </GameStateProvider>
  )
}

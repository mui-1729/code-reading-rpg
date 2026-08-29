import { RouterProvider } from '@tanstack/react-router'
import { BattleItemPanel } from './economy/BattleItemPanel'
import { BattleEscapePanel } from './game/BattleEscapePanel'
import { BattleRouteGate } from './game/BattleRouteGate'
import { ProgressProvider } from './progression'
import { BattleResultSequence } from './results/BattleResultSequence'
import { RpgProvider } from './rpg'
import { router } from './router'
import { TutorialPrompt, TutorialProvider } from './tutorial'
import { WorldCharacterDecorations } from './world/WorldCharacterDecorations'
import { TypeScriptRegionGate } from './world/TypeScriptRegionGate'

export function AppRouter() {
  return (
    <ProgressProvider>
      <RpgProvider>
        <TutorialProvider>
          <RouterProvider router={router} />
          <BattleRouteGate />
          <TutorialPrompt />
          <BattleItemPanel />
          <BattleEscapePanel />
          <BattleResultSequence />
          <WorldCharacterDecorations />
          <TypeScriptRegionGate />
        </TutorialProvider>
      </RpgProvider>
    </ProgressProvider>
  )
}

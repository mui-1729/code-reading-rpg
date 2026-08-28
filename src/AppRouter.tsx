import { RouterProvider } from '@tanstack/react-router'
import { BattleItemPanel } from './economy/BattleItemPanel'
import { BattleEscapePanel } from './game/BattleEscapePanel'
import { BattleCodeData } from './inspector'
import { ProgressProvider } from './progression'
import { BattleResultSequence } from './results/BattleResultSequence'
import { RpgProvider } from './rpg'
import { router } from './router'
import { TutorialPrompt, TutorialProvider } from './tutorial'
import { TypeScriptRegionGate } from './world/TypeScriptRegionGate'

export function AppRouter() {
  return (
    <ProgressProvider>
      <RpgProvider>
        <TutorialProvider>
          <RouterProvider router={router} />
          <TutorialPrompt />
          <BattleCodeData />
          <BattleItemPanel />
          <BattleEscapePanel />
          <BattleResultSequence />
          <TypeScriptRegionGate />
        </TutorialProvider>
      </RpgProvider>
    </ProgressProvider>
  )
}

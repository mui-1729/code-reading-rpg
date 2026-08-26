import { RouterProvider } from '@tanstack/react-router'
import { AreaShop } from './economy'
import { BattleCodeData } from './inspector'
import { ProgressProvider } from './progression'
import { BattleResultSequence } from './results/BattleResultSequence'
import { router } from './router'
import { TutorialPrompt, TutorialProvider } from './tutorial'

export function AppRouter() {
  return (
    <ProgressProvider>
      <TutorialProvider>
        <RouterProvider router={router} />
        <TutorialPrompt />
        <BattleCodeData />
        <BattleResultSequence />
        <AreaShop />
      </TutorialProvider>
    </ProgressProvider>
  )
}

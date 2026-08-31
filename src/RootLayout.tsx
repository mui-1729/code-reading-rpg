import { Outlet } from '@tanstack/react-router'
import { FullResetCoordinator } from './FullResetCoordinator'
import { BattleRouteGate } from './game/BattleRouteGate'
import { TutorialPrompt } from './tutorial'
import { PauseMenu } from './ui/PauseMenu'
import { WorldProgressFeedback } from './world/WorldProgressFeedback'

export function RootLayout() {
  return (
    <>
      <Outlet />
      <BattleRouteGate />
      <TutorialPrompt />
      <FullResetCoordinator />
      <PauseMenu />
      <WorldProgressFeedback />
    </>
  )
}

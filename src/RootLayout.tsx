import { Outlet } from '@tanstack/react-router'
import { FullResetCoordinator } from './FullResetCoordinator'
import { PauseMenu } from './ui/PauseMenu'
import { WorldAtlasOverlay } from './ui/WorldAtlasOverlay'
import { WorldProgressFeedback } from './world/WorldProgressFeedback'

export function RootLayout() {
  return (
    <>
      <Outlet />
      <FullResetCoordinator />
      <WorldAtlasOverlay />
      <PauseMenu />
      <WorldProgressFeedback />
    </>
  )
}

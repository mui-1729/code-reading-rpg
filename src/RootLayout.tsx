import { Outlet } from '@tanstack/react-router'
import { PauseMenu } from './ui/PauseMenu'
import { WorldProgressFeedback } from './world/WorldProgressFeedback'

export function RootLayout() {
  return (
    <>
      <Outlet />
      <PauseMenu />
      <WorldProgressFeedback />
    </>
  )
}

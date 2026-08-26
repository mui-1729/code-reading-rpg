import { Outlet } from '@tanstack/react-router'
import { CodeCodex } from './learning/CodeCodex'
import { PauseMenu } from './ui/PauseMenu'
import { WorldProgressFeedback } from './world/WorldProgressFeedback'

export function RootLayout() {
  return (
    <>
      <Outlet />
      <PauseMenu />
      <WorldProgressFeedback />
      <CodeCodex />
    </>
  )
}

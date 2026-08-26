import { Outlet } from '@tanstack/react-router'
import { QuestTracker } from './quests/QuestTracker'

export function RootLayout() {
  return (
    <>
      <Outlet />
      <QuestTracker />
    </>
  )
}

import { Outlet } from '@tanstack/react-router'
import { CodeCodex } from './learning/CodeCodex'
import { QuestTracker } from './quests/QuestTracker'
import { QuestVictoryFeedback } from './quests/QuestVictoryFeedback'

export function RootLayout() {
  return (
    <>
      <Outlet />
      <QuestVictoryFeedback />
      <QuestTracker />
      <CodeCodex />
    </>
  )
}

import { Outlet } from '@tanstack/react-router'
import { CodeCodex } from './learning/CodeCodex'
import { PauseMenu } from './ui/PauseMenu'
import { QuestVictoryFeedback } from './quests/QuestVictoryFeedback'

export function RootLayout() {
  return (
    <>
      <Outlet />
      <PauseMenu />
      <QuestVictoryFeedback />
      <CodeCodex />
    </>
  )
}

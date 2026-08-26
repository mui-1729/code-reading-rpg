import { RouterProvider } from '@tanstack/react-router'
import { ProgressProvider } from './progression'
import { router } from './router'
import { TutorialPrompt, TutorialProvider } from './tutorial'

export function AppRouter() {
  return (
    <ProgressProvider>
      <TutorialProvider>
        <RouterProvider router={router} />
        <TutorialPrompt />
      </TutorialProvider>
    </ProgressProvider>
  )
}

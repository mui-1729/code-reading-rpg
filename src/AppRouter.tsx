import { RouterProvider } from '@tanstack/react-router'
import { ProgressProvider } from './progression'
import { router } from './router'

export function AppRouter() {
  return (
    <ProgressProvider>
      <RouterProvider router={router} />
    </ProgressProvider>
  )
}

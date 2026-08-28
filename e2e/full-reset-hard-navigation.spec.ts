import { expect, test } from '@playwright/test'

const OPENING_KEY = 'code-read-rpg:javascript-opening:v1'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('RESET PROGRESSはWorld Tutorialを残さずdocumentごとTitleへ戻す', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(
    ({ openingKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(openingKey, 'seen')
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'completed', phase: 'battle' }),
      )
    },
    { openingKey: OPENING_KEY, tutorialKey: TUTORIAL_KEY },
  )
  await page.goto('/world')

  await page.evaluate(() => {
    ;(window as Window & { __fullResetDocumentMarker?: string }).__fullResetDocumentMarker = 'alive'
  })

  await page.getByRole('button', { name: 'Pause menuを開く' }).click()
  const dialog = page.getByRole('dialog', { name: 'Pause menu' })
  await dialog.getByRole('button', { name: 'SYSTEM' }).click()
  await dialog.getByRole('button', { name: 'RESET PROGRESS' }).click()
  await dialog.getByRole('button', { name: 'CONFIRM RESET PROGRESS' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('button', { name: 'START' })).toBeVisible()
  await expect(page.locator('.tutorial-prompt-field')).toHaveCount(0)
  await expect.poll(() =>
    page.evaluate(() =>
      (window as Window & { __fullResetDocumentMarker?: string }).__fullResetDocumentMarker ?? null,
    ),
  ).toBeNull()
})

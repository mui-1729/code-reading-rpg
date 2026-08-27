import { expect, test } from '@playwright/test'

const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

const seedTutorial = async (page: Parameters<typeof test>[0]['page'], phase: string) => {
  await page.goto('/')
  await page.evaluate(({ key, phaseValue }) => {
    localStorage.clear()
    localStorage.setItem(key, JSON.stringify({ version: 1, status: 'active', phase: phaseValue }))
  }, { key: TUTORIAL_KEY, phaseValue: phase })
}

test('mobile TutorialがD-Pad操作を遮らない', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedTutorial(page, 'field-move')
  await page.goto('/world')

  await expect(page.locator('.tutorial-prompt-field')).toBeVisible()
  const player = page.locator('.world-player-sprite')
  const beforeX = await player.evaluate((element) => element.parentElement?.dataset.worldX)
  await page.getByRole('button', { name: 'Move left' }).click()
  await expect.poll(() => player.evaluate((element) => element.parentElement?.dataset.worldX)).not.toBe(beforeX)
})

test('mobile TutorialがINTERACT操作を遮らない', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedTutorial(page, 'field-interact')
  await page.goto('/world')

  await expect(page.locator('.tutorial-prompt-field')).toBeVisible()
  const interact = page.getByRole('button', { name: 'INTERACT' })
  await expect(interact).toBeVisible()
  await interact.click()
})

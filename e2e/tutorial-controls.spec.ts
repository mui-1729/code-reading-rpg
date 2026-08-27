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

test('mobile TutorialがBYTE隣接時のINTERACT操作を認識する', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedTutorial(page, 'field-interact')
  await page.goto('/world')

  await expect(page.locator('.tutorial-prompt-field')).toContainText('BYTE / SHOP / BOSSの隣まで歩こう')
  await page.getByRole('button', { name: 'Move left' }).click()
  await expect(page.locator('.tutorial-prompt-field')).toContainText('INTERACTを押して調べる')

  await page.getByRole('button', { name: 'INTERACT' }).click()
  await expect(page.getByText(/BYTE joined the party!/)).toBeVisible()
  await expect.poll(async () => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null')?.phase, TUTORIAL_KEY)).toBe('battle')
})

test('SYSTEMからTutorialを最初からやり直せる', async ({ page }) => {
  await page.goto('/')
  await page.evaluate((key) => {
    localStorage.clear()
    localStorage.setItem(key, JSON.stringify({ version: 1, status: 'completed', phase: 'battle' }))
  }, TUTORIAL_KEY)
  await page.goto('/world')

  await expect(page.locator('.tutorial-prompt')).toHaveCount(0)
  await page.getByRole('button', { name: 'Pause menuを開く' }).click()
  const menu = page.getByRole('dialog', { name: 'Pause menu' })
  await menu.getByRole('button', { name: 'SYSTEM' }).click()
  await menu.getByRole('button', { name: 'REPLAY TUTORIAL' }).click()

  await expect(page.locator('.tutorial-prompt-field')).toContainText('MOVE')
  await expect.poll(async () => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null')?.status, TUTORIAL_KEY)).toBe('active')
})
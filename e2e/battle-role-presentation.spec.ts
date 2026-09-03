import { expect, test } from '@playwright/test'

test('STANDARD等の内部roleを本文に出さず、強敵badgeでもcard高さを変えない', async ({ page }) => {
  await page.goto('/javascript/battle/13?seed=midboss%3Ajs-forest%3A1&returnTo=%2Fworld')

  const story = page.getByRole('dialog')
  if (await story.isVisible()) {
    const skip = story.getByRole('button', { name: /SKIP|スキップ/ })
    if (await skip.isVisible()) await skip.click()
  }

  const standard = page.locator('.enemy-card[data-enemy-role="standard"]')
  const elite = page.locator('.enemy-card[data-enemy-role="elite"]')
  await expect(standard).toBeVisible()
  await expect(elite).toBeVisible()

  await expect(standard.locator('.enemy-role')).toBeHidden()
  await expect(elite.locator('.enemy-role')).toBeHidden()
  await expect(standard).not.toContainText(/standard/i)

  const eliteBadge = await elite.evaluate((element) => getComputedStyle(element, '::before').content)
  expect(eliteBadge).toContain('強敵')

  const [standardBox, eliteBox] = await Promise.all([standard.boundingBox(), elite.boundingBox()])
  expect(standardBox).not.toBeNull()
  expect(eliteBox).not.toBeNull()
  if (!standardBox || !eliteBox) return
  expect(Math.abs(standardBox.height - eliteBox.height)).toBeLessThanOrEqual(1)
})

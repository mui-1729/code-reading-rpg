import { expect, test } from '@playwright/test'

const openingKey = 'code-read-rpg:javascript-opening:v1'

const resetOpening = async (page: import('@playwright/test').Page) => {
  await page.goto('/')
  await page.evaluate((key) => window.localStorage.removeItem(key), openingKey)
  await page.reload()
}

test('first START plays the JavaScript opening before entering the world', async ({ page }) => {
  await resetOpening(page)

  await expect(page.getByRole('button', { name: 'START' })).toBeVisible()
  await page.getByRole('button', { name: 'START' }).click()

  await expect(page.locator('.opening-kicker')).toHaveText('JAVASCRIPT KINGDOM')
  await expect(page.locator('.opening-copy')).toContainText('コードで動いている')

  await page.getByRole('button', { name: 'NEXT ▶' }).click()
  await expect(page.locator('.opening-kicker')).toHaveText('SYSTEM ERROR')

  await page.getByRole('button', { name: 'NEXT ▶' }).click()
  await expect(page.locator('.opening-speaker')).toHaveText('LEAD ADA')
  await expect(page.locator('.opening-copy')).toContainText('新人Code Knight')

  await page.getByRole('button', { name: 'NEXT ▶' }).click()
  await expect(page.locator('.opening-speaker')).toHaveText('BYTE')

  await page.getByRole('button', { name: 'NEXT ▶' }).click()
  await expect(page.locator('.opening-kicker')).toHaveText('MISSION START')
  await expect(page.locator('.opening-copy')).toContainText('まずHubでBYTEと合流する')

  await page.getByRole('button', { name: '▶ Hubへ出発' }).click()
  await expect(page).toHaveURL(/\/world$/)
  await expect(page.getByLabel('Open world map')).toBeVisible()
  await expect(page.getByLabel('Next objective')).toContainText('BYTEと合流する')
  await expect(page.getByLabel('Next objective')).toContainText('左か上へ1歩')
})

test('after the opening is seen, CONTINUE enters the world and opening can be replayed', async ({ page }) => {
  await page.goto('/')
  await page.evaluate((key) => window.localStorage.setItem(key, 'seen'), openingKey)
  await page.reload()

  await expect(page.getByRole('button', { name: 'CONTINUE' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'VIEW OPENING' })).toBeVisible()

  await page.getByRole('button', { name: 'VIEW OPENING' }).click()
  await expect(page.locator('.opening-kicker')).toHaveText('JAVASCRIPT KINGDOM')

  await page.getByRole('button', { name: 'SKIP' }).click()
  await expect(page).toHaveURL(/\/world$/)
})
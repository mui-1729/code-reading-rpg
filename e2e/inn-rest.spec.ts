import { seedLegacyGameState } from './game-state-fixtures'
import { readStoredGameState } from './storedGameState'
import { expect, test, type Page } from '@playwright/test'

async function seedInnState(page: Page, options: { gold: number; currentHp: number }) {
  await seedLegacyGameState(page, {
    progress: { gold: options.gold, unlockedStageIds: [1, 4] },
    rpg: { currentHp: options.currentHp, worldPosition: { x: 20, y: 16 } },
  })
  await page.goto('/world')
}

async function faceInn(page: Page) {
  await page.getByRole('button', { name: '右へ移動' }).click()
  await expect(page.locator('.world-player-sprite')).toHaveAttribute('data-facing', 'right')
  await expect(page.getByRole('button', { name: '宿で休む' })).toBeEnabled()
}

test.describe('宿', () => {
  test('HP満タンでは20Gを消費せず休めないことを明示する', async ({ page }) => {
    await seedInnState(page, { gold: 50, currentHp: 108 })
    await faceInn(page)

    await page.getByRole('button', { name: '宿で休む' }).click()
    const inn = page.getByRole('dialog', { name: '宿' })
    await expect(inn.getByText('108 / 108', { exact: true })).toBeVisible()
    await expect(inn.getByText('満タン', { exact: true })).toBeVisible()
    await expect(inn.getByText('50 G → 50 G', { exact: true })).toBeVisible()
    await expect(inn.getByText('料金不要 · HP満タン', { exact: true })).toBeVisible()
    await expect(inn.getByRole('button', { name: 'HP満タン' })).toBeDisabled()

    const stored = await readStoredGameState(page)
    expect(stored.progress.progress.gold).toBe(50)
    expect(stored.rpg.state.currentHp).toBe(108)
  })

  test('ゴールド不足では不足額を表示しHP / Goldを変更しない', async ({ page }) => {
    await seedInnState(page, { gold: 7, currentHp: 40 })
    await faceInn(page)

    await page.getByRole('button', { name: '宿で休む' }).click()
    const inn = page.getByRole('dialog', { name: '宿' })
    await expect(inn.getByText('40 / 108', { exact: true })).toBeVisible()
    await expect(inn.getByText('+68 HP', { exact: true })).toBeVisible()
    await expect(inn.getByText('7 G → —', { exact: true })).toBeVisible()
    await expect(inn.locator('.inn-cost-card em')).toHaveText('あと 13 G必要')
    await expect(inn.getByRole('button', { name: 'あと 13 G必要' })).toBeDisabled()

    const stored = await readStoredGameState(page)
    expect(stored.progress.progress.gold).toBe(7)
    expect(stored.rpg.state.currentHp).toBe(40)
  })
})

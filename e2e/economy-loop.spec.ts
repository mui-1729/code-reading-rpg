import { seedLegacyGameState } from './game-state-fixtures'
import { readStoredGameState } from './storedGameState'
import { expect, test, type Page } from '@playwright/test'
import { JS_BATTLE_1_PREREQS } from './canonical-progress-fixtures'
import { selectPauseTab } from './pause-menu-helpers'

async function seedEconomyLoop(page: Page) {
  await seedLegacyGameState(page, {
    progress: {
      gold: 50,
      clearedStageIds: JS_BATTLE_1_PREREQS,
      unlockedStageIds: [1],
    },
    rpg: {
      currentHp: 100,
      worldPosition: { x: 21, y: 12 },
    },
  })
}

async function dismissStory(page: Page) {
  const story = page.locator('.battle-story-window')
  await expect(story).toBeVisible()
  await story.getByRole('button', { name: 'スキップ', exact: true }).click()
  await expect(story).toBeHidden()
}

async function executeSkill(page: Page, name: string) {
  const fight = page.getByRole('button', { name: '戦う', exact: true })
  if ((await fight.getAttribute('aria-pressed')) !== 'true') await fight.click()
  const card = page.getByRole('button', { name: new RegExp(`^${name}\\b`) })
  await expect(card).toBeEnabled()
  await card.click()
  await expect(card).toHaveClass(/selected/)
  await card.click()
}

test('Battle Gold → Shop purchase/equip → Inn → reload → next canonical Battleを1本で維持する', async ({ page }) => {
  await seedEconomyLoop(page)

  await page.goto('/javascript/battle/1?seed=encounter%3Aoverworld%3A5%3A10%3A11&returnTo=%2Fworld')
  await expect(page.locator('.battle-console')).toBeVisible()
  await dismissStory(page)

  await executeSkill(page, 'TRACE')
  await executeSkill(page, 'PULSE')
  await executeSkill(page, 'TRACE')
  await expect(page.getByText('勝利', { exact: true })).toBeVisible()

  // First incident keeps the established 20 G reward: 50 + 20 = 70.
  await expect.poll(async () => (await readStoredGameState(page)).progress.progress.gold).toBe(70)
  const skip = page.getByRole('button', { name: 'スキップ', exact: true })
  if (await skip.isVisible()) await skip.click()
  await page.getByRole('button', { name: /ワールドへ戻る/ }).click()
  await expect(page).toHaveURL(/\/world$/)

  let stored = await readStoredGameState(page)
  expect(stored.progress.progress.clearedStageIds).toContain(1)
  expect(stored.progress.progress.unlockedStageIds).toContain(7)
  expect(stored.progress.progress.unlockedStageIds).not.toContain(10)
  expect(stored.rpg.state.currentHp).toBeGreaterThan(0)

  await page.getByRole('button', { name: 'ショップを見る' }).click()
  const shop = page.getByRole('dialog', { name: 'ショップ' })
  const lifeCharm = shop.locator('[data-equipment-id="life-charm"]')
  const quote = lifeCharm.locator('.shop-cost-preview')
  await expect(quote.getByText('70 G', { exact: true })).toBeVisible()
  await expect(quote.getByText('50 G', { exact: true })).toBeVisible()
  await expect(quote.getByText('20 G', { exact: true })).toBeVisible()
  await lifeCharm.getByRole('button', { name: '▶ 購入' }).click()
  await expect(lifeCharm.getByRole('button', { name: '▶ 装備する' })).toBeEnabled()

  stored = await readStoredGameState(page)
  expect(stored.progress.progress.gold).toBe(20)
  expect(stored.rpg.state.ownedEquipmentIds).toContain('life-charm')
  expect(stored.rpg.state.equipment.accessory).toBeNull()

  await lifeCharm.getByRole('button', { name: '▶ 装備する' }).click()
  await expect(lifeCharm).toHaveAttribute('data-equipment-state', 'equipped')
  await shop.getByRole('button', { name: 'ショップを閉じる' }).click()

  await page.getByRole('button', { name: '下へ移動' }).click()
  await page.getByRole('button', { name: '下へ移動' }).click()
  await page.getByRole('button', { name: '下へ移動' }).click()
  await page.getByRole('button', { name: '宿で休む' }).click()

  const inn = page.getByRole('dialog', { name: '宿' })
  await expect(inn.getByText('20 G → 0 G', { exact: true })).toBeVisible()
  await inn.getByRole('button', { name: '▶ 休む' }).click()
  await expect(page.locator('.world-message')).toContainText('全回復')

  stored = await readStoredGameState(page)
  expect(stored.progress.progress.gold).toBe(0)
  expect(stored.rpg.state.equipment.accessory).toBe('life-charm')
  expect(stored.rpg.state.currentHp).toBeGreaterThan(100)

  await page.reload()
  await page.getByRole('button', { name: 'メニューを開く' }).click()
  const pause = page.getByRole('dialog', { name: 'メニュー' })
  await expect(pause.getByText('0 G', { exact: true })).toBeVisible()
  await selectPauseTab(pause, '装備')
  const accessorySlot = pause.locator('[data-equipment-slot="accessory"]')
  await expect(accessorySlot.locator('header strong')).toHaveText('Life Charm')
  await expect(accessorySlot.getByRole('button', { name: /アクセサリを選ぶ/ })).toContainText('Life Charm')
  await page.keyboard.press('Escape')

  await page.goto('/javascript/battle/7?seed=economy-next&returnTo=%2Fworld')
  await dismissStory(page)
  await expect(page).toHaveURL(/\/javascript\/battle\/7/)
  await expect(page.locator('.battle-console')).toBeVisible()
})

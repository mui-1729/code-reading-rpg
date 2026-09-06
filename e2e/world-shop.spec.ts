import { seedLegacyGameState } from './game-state-fixtures'
import { readStoredGameState } from './storedGameState'
import { expect, test, type Page } from '@playwright/test'
import { selectPauseTab } from './pause-menu-helpers'

async function seedShopState(page: Page, gold = 200) {
  await seedLegacyGameState(page, {
    progress: { gold, unlockedStageIds: [1, 4] },
    rpg: { worldPosition: { x: 21, y: 12 } },
  })
  await page.goto('/world')
}

async function faceShop(page: Page) {
  await page.getByRole('button', { name: '左へ移動' }).click()
  await expect(page.locator('.world-player-sprite')).toHaveAttribute('data-facing', 'left')
  await expect(page.getByRole('button', { name: 'ショップを見る' })).toBeEnabled()
}

test.describe('World Shop', () => {
  test('所持金→価格→購入後を確認してEquipment購入し装備、reload後も維持する', async ({ page }) => {
    await seedShopState(page)
    await faceShop(page)

    await page.getByRole('button', { name: 'ショップを見る' }).click()
    const shop = page.getByRole('dialog', { name: 'ショップ' })
    await expect(shop).toBeVisible()
    await expect(shop.locator('.shop-wallet').getByText('200 G', { exact: true })).toBeVisible()
    await expect(shop.getByRole('region', { name: '消耗品' })).toBeVisible()
    await expect(shop.getByRole('region', { name: '装備品' })).toBeVisible()

    const guardEdge = shop.locator('[data-equipment-id="guard-edge"]')
    await expect(guardEdge).toHaveAttribute('data-equipment-state', 'available')
    await expect(guardEdge.getByText('ATK +4 · DEF +2', { exact: true })).toBeVisible()
    await expect(guardEdge.getByText('現在装備 · Training Blade', { exact: true })).toBeVisible()
    await expect(guardEdge.getByText('ATK +1 · DEF +2', { exact: true })).toBeVisible()
    await expect(guardEdge.locator('img')).toHaveAttribute(
      'src',
      '/pixel-art/equipment/weapons/guard-edge.svg',
    )

    const quote = guardEdge.locator('.shop-cost-preview')
    await expect(quote.getByText('所持金', { exact: true })).toBeVisible()
    await expect(quote.getByText('価格', { exact: true })).toBeVisible()
    await expect(quote.getByText('購入後', { exact: true })).toBeVisible()
    await expect(quote.getByText('200 G', { exact: true })).toBeVisible()
    await expect(quote.getByText('55 G', { exact: true })).toBeVisible()
    await expect(quote.getByText('145 G', { exact: true })).toBeVisible()

    await guardEdge.getByRole('button', { name: '▶ 購入' }).click()
    await expect(guardEdge).toHaveAttribute('data-equipment-state', 'owned')
    await expect(guardEdge.getByRole('button', { name: '▶ 装備する' })).toBeEnabled()
    await expect(shop.locator('.shop-wallet').getByText('145 G', { exact: true })).toBeVisible()

    let stored = await readStoredGameState(page)
    expect(stored.progress.progress.gold).toBe(145)
    expect(stored.rpg.state.ownedEquipmentIds).toContain('guard-edge')
    expect(stored.rpg.state.equipment.weapon).toBe('training-blade')

    await guardEdge.getByRole('button', { name: '▶ 装備する' }).click()
    await expect(guardEdge).toHaveAttribute('data-equipment-state', 'equipped')
    await expect(guardEdge.getByRole('button', { name: '装備中' })).toBeDisabled()

    stored = await readStoredGameState(page)
    expect(stored.progress.progress.gold).toBe(145)
    expect(stored.rpg.state.equipment.weapon).toBe('guard-edge')

    await shop.getByRole('button', { name: 'ショップを閉じる' }).click()
    await page.reload()
    await page.getByRole('button', { name: 'メニューを開く' }).click()
    const pause = page.getByRole('dialog', { name: 'メニュー' })
    await selectPauseTab(pause, '装備')
    const weaponSlot = pause.locator('[data-equipment-slot="weapon"]')
    await expect(weaponSlot.locator('header strong')).toHaveText('Guard Edge')
    await expect(weaponSlot.getByRole('button', { name: /武器を選ぶ/ })).toContainText('Guard Edge')

    stored = await readStoredGameState(page)
    expect(stored.rpg.state.ownedEquipmentIds.filter((id: string) => id === 'guard-edge')).toHaveLength(1)
    expect(stored.rpg.state.equipment.weapon).toBe('guard-edge')
  })

  test('Gold不足のEquipmentはvisualと比較を残し不足額を明示する', async ({ page }) => {
    await seedShopState(page, 10)
    await faceShop(page)

    await page.getByRole('button', { name: 'ショップを見る' }).click()
    const shop = page.getByRole('dialog', { name: 'ショップ' })
    const vitalCoat = shop.locator('[data-equipment-id="vital-coat"]')
    await expect(vitalCoat).toHaveAttribute('data-equipment-state', 'unavailable')
    await expect(vitalCoat.getByText('現在装備 · Traveler Coat', { exact: true })).toBeVisible()
    await expect(vitalCoat.getByText('DEF -2 · HP +14', { exact: true })).toBeVisible()
    await expect(vitalCoat.locator('img')).toHaveAttribute(
      'src',
      '/pixel-art/equipment/armor/vital-coat.svg',
    )

    const quote = vitalCoat.locator('.shop-cost-preview')
    await expect(quote.getByText('10 G', { exact: true })).toBeVisible()
    await expect(quote.getByText('60 G', { exact: true })).toBeVisible()
    await expect(quote.getByText('—', { exact: true })).toBeVisible()
    await expect(quote.locator('em')).toHaveText('あと 50 G')
    await expect(vitalCoat.getByRole('button', { name: 'あと 50 G' })).toBeDisabled()

    const stored = await readStoredGameState(page)
    expect(stored.progress.progress.gold).toBe(10)
    expect(stored.rpg.state.ownedEquipmentIds).not.toContain('vital-coat')
  })
})

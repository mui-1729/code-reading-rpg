import { seedLegacyGameState } from './game-state-fixtures'
import { readStoredGameState } from './storedGameState'
import { expect, test, type Page } from '@playwright/test'
import { JS_BATTLE_1_PREREQS, JS_COMPLETE } from './canonical-progress-fixtures'
import { selectPauseTab } from './pause-menu-helpers'

async function seedItemState(
  page: Page,
  options: {
    gold?: number
    patchKit?: number
    currentHp?: number
    worldPosition?: { x: number; y: number }
    clearedStageIds?: readonly number[]
  } = {},
) {
  await seedLegacyGameState(page, {
    progress: {
      gold: options.gold ?? 0,
      patchKit: options.patchKit ?? 0,
      clearedStageIds: options.clearedStageIds ?? JS_BATTLE_1_PREREQS,
      unlockedStageIds: [7],
    },
    rpg: {
      currentHp: options.currentHp ?? 108,
      worldPosition: options.worldPosition ?? { x: 20, y: 14 },
    },
  })
}

async function dismissStory(page: Page) {
  const story = page.locator('.battle-story-window')
  await expect(story).toBeVisible()
  await story.getByRole('button', { name: 'スキップ', exact: true }).click()
  await expect(story).toBeHidden()
}

async function openBattleItems(page: Page) {
  await page.getByRole('group', { name: '戦闘コマンド' }).getByRole('button', { name: 'アイテム', exact: true }).click()
  const menu = page.getByRole('group', { name: 'アイテム選択' })
  await expect(menu).toBeVisible()
  return menu
}

async function openPatchKitDetail(page: Page) {
  const menu = await openBattleItems(page)
  const row = menu.locator('.battle-item-browser-row[data-item-id="patch-kit"]')
  await row.click()
  const detail = page.locator('.battle-item-detail[data-item-id="patch-kit"]')
  await expect(detail).toBeVisible()
  return { detail, menu, row }
}

test.describe('Item / Inventory UX', () => {
  test('existing v4 inventoryをメニューのitem cardへそのまま表示する', async ({ page }) => {
    await seedItemState(page, { patchKit: 2 })
    await page.goto('/world')

    await page.getByRole('button', { name: 'メニューを開く' }).click()
    const pause = page.getByRole('dialog', { name: 'メニュー' })
    await selectPauseTab(pause, 'アイテム')

    const item = pause.locator('[data-item-id="patch-kit"]')
    await expect(item).toHaveAttribute('data-item-count', '2')
    await expect(item.locator('img')).toHaveAttribute('src', '/pixel-art/items/patch-kit.svg')
    await expect(item.getByText('PATCH KIT', { exact: true })).toBeVisible()
    await expect(item.getByText('HP +24', { exact: true })).toBeVisible()
    await expect(item.getByText('戦闘専用 · 1回', { exact: true })).toBeVisible()
    await expect(item.getByText('戦闘で使用可能', { exact: true })).toBeVisible()
  })

  test('Shop購入したPATCH KITを同じvisualでメニューinventoryへ反映する', async ({ page }) => {
    await seedItemState(page, {
      gold: 30,
      patchKit: 0,
      worldPosition: { x: 21, y: 12 },
    })
    await page.goto('/world')

    await page.getByRole('button', { name: '左へ移動' }).click()
    await page.getByRole('button', { name: 'ショップを見る' }).click()
    const shop = page.getByRole('dialog', { name: 'ショップ' })
    const item = shop.locator('[data-item-id="patch-kit"]')
    await expect(item).toHaveAttribute('data-item-state', 'available')
    await expect(item.locator('img')).toHaveAttribute('src', '/pixel-art/items/patch-kit.svg')
    await expect(item.getByText('HP +24', { exact: true })).toBeVisible()
    await expect(item.getByText('戦闘専用 · 1回', { exact: true })).toBeVisible()
    await item.getByRole('button', { name: '▶ 購入' }).click()

    const stored = await readStoredGameState(page)
    expect(stored.progress.progress.gold).toBe(0)
    expect(stored.progress.progress.inventory.patchKit).toBe(1)

    await shop.getByRole('button', { name: 'ショップを閉じる' }).click()
    await page.getByRole('button', { name: 'メニューを開く' }).click()
    const pause = page.getByRole('dialog', { name: 'メニュー' })
    await selectPauseTab(pause, 'アイテム')
    const inventoryItem = pause.locator('[data-item-id="patch-kit"]')
    await expect(inventoryItem).toHaveAttribute('data-item-count', '1')
    await expect(inventoryItem.locator('img')).toHaveAttribute('src', '/pixel-art/items/patch-kit.svg')
  })

  test('BattleでPATCH KITを使用するとHPとstockを更新し使用済み理由を表示する', async ({ page }) => {
    await seedItemState(page, { patchKit: 1, currentHp: 40 })
    await page.goto('/javascript/battle/1?seed=item-use-e2e&returnTo=%2Fworld')
    await dismissStory(page)
    const firstOpen = await openPatchKitDetail(page)

    await expect(firstOpen.row.locator('img')).toHaveAttribute('src', '/pixel-art/items/patch-kit.svg')
    await expect(firstOpen.row).toContainText('PATCH KIT')
    await expect(firstOpen.row).toContainText('×1')
    const useButton = firstOpen.menu.getByRole('button', { name: /PATCH KIT ×1を使う/ })
    await expect(useButton).toBeEnabled()
    await useButton.click()

    await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('64/108')
    const stored = await readStoredGameState(page)
    expect(stored.rpg.state.currentHp).toBe(64)
    expect(stored.progress.progress.inventory.patchKit).toBe(0)

    const usedOpen = await openPatchKitDetail(page)
    await expect(usedOpen.detail).toContainText('PATCH KIT ×0')
    await expect(usedOpen.menu.locator('.battle-item-state')).toContainText('この戦闘では使用済み')
    await expect(usedOpen.menu.locator('.patch-kit-action')).toBeDisabled()
  })

  test('未完了Stageを別seedで開くと回復と消費をrollbackして使用回数もresetする', async ({ page }) => {
    await seedItemState(page, { patchKit: 2, currentHp: 40 })
    await page.goto('/javascript/battle/1?seed=item-replay-a&returnTo=%2Fworld')
    await dismissStory(page)

    const firstOpen = await openPatchKitDetail(page)
    await firstOpen.menu.getByRole('button', { name: /PATCH KIT ×2を使う/ }).click()
    await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('64/108')

    await page.goto('/javascript/battle/1?seed=item-replay-b&returnTo=%2Fworld')
    await dismissStory(page)
    const replayOpen = await openPatchKitDetail(page)
    await expect(replayOpen.row).toContainText('PATCH KIT')
    await expect(replayOpen.row).toContainText('×2')
    await expect(replayOpen.menu.locator('.patch-kit-action')).toBeEnabled()
    await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('40/108')
  })

  test('Battleで所持なし / HP満タンを明示して使用不可にする', async ({ page }) => {
    await seedItemState(page, { patchKit: 0, currentHp: 40 })
    await page.goto('/javascript/battle/1?seed=item-no-stock-e2e&returnTo=%2Fworld')
    await dismissStory(page)
    const noStockOpen = await openPatchKitDetail(page)
    await expect(noStockOpen.row).toContainText('×0')
    await expect(noStockOpen.menu).not.toContainText('所持なし')
    await expect(noStockOpen.menu.getByRole('button', { name: /PATCH KIT ×0を使う/ })).toBeDisabled()

    await seedItemState(page, { patchKit: 1, currentHp: 108 })
    await page.goto('/javascript/battle/1?seed=item-hp-full-e2e&returnTo=%2Fworld')
    await dismissStory(page)
    const fullHpOpen = await openPatchKitDetail(page)
    await expect(fullHpOpen.menu.locator('.battle-item-state')).toContainText('HP満タン')
    await expect(fullHpOpen.menu.getByRole('button', { name: /PATCH KIT ×1を使う/ })).toBeDisabled()
  })

  test('TYPE CACHE取得時に同じPATCH KIT visualでItem rewardを表示する', async ({ page }) => {
    await seedItemState(page, {
      gold: 10,
      patchKit: 2,
      worldPosition: { x: 30, y: 18 },
      clearedStageIds: JS_COMPLETE,
    })
    await page.goto('/world')

    await page.getByRole('button', { name: '右へ移動' }).click()
    await page.getByRole('button', { name: '宝箱を開ける' }).click()
    await expect(page.getByText(/TYPE CACHE 開封/)).toBeVisible()

    const reward = page.locator('[data-item-reward-id="patch-kit"]')
    await expect(reward).toBeVisible()
    await expect(reward).toHaveAttribute('data-item-reward-count', '1')
    await expect(reward.locator('img')).toHaveAttribute('src', '/pixel-art/items/patch-kit.svg')
    await expect(reward.getByText('アイテム獲得', { exact: true })).toBeVisible()
    await expect(reward.getByText('PATCH KIT ×1', { exact: true })).toBeVisible()

    const stored = await readStoredGameState(page)
    expect(stored.progress.progress.gold).toBe(45)
    expect(stored.progress.progress.inventory.patchKit).toBe(3)
  })
})

import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedItemState(
  page: Page,
  options: {
    gold?: number
    patchKit?: number
    currentHp?: number
    worldPosition?: { x: number; y: number }
  } = {},
) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, gold, patchKit, currentHp, worldPosition }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold,
            inventory: { patchKit },
            clearedStageIds: [],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 4],
            unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 3,
          state: {
            equipment: {
              weapon: 'training-blade',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: [],
            partyEquipment: {},
            worldPosition,
            stepsSinceEncounter: 8,
            encounterCount: 0,
            currentHp,
            openedTreasureIds: [],
          },
        }),
      )
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
    },
    {
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
      gold: options.gold ?? 0,
      patchKit: options.patchKit ?? 0,
      currentHp: options.currentHp ?? 108,
      worldPosition: options.worldPosition ?? { x: 20, y: 14 },
    },
  )
}

async function storedState(page: Page) {
  return page.evaluate(
    ({ progressKey, rpgKey }) => ({
      progress: JSON.parse(localStorage.getItem(progressKey) ?? 'null'),
      rpg: JSON.parse(localStorage.getItem(rpgKey) ?? 'null'),
    }),
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY },
  )
}

test.describe('Item / Inventory UX', () => {
  test('existing v4 inventoryをPause item cardへそのまま表示する', async ({ page }) => {
    await seedItemState(page, { patchKit: 2 })
    await page.goto('/world')

    await page.getByRole('button', { name: 'Pause menuを開く' }).click()
    const pause = page.getByRole('dialog', { name: 'Pause menu' })
    await pause.getByRole('button', { name: 'ITEMS' }).click()

    const item = pause.locator('[data-item-id="patch-kit"]')
    await expect(item).toHaveAttribute('data-item-count', '2')
    await expect(item.locator('img')).toHaveAttribute('src', '/pixel-art/items/patch-kit.svg')
    await expect(item.getByText('PATCH KIT', { exact: true })).toBeVisible()
    await expect(item.getByText('HP +24', { exact: true })).toBeVisible()
    await expect(item.getByText('BATTLE ONLY · 1 USE', { exact: true })).toBeVisible()
    await expect(item.getByText('READY IN BATTLE', { exact: true })).toBeVisible()
  })

  test('Shop購入したPATCH KITを同じvisualでPause inventoryへ反映する', async ({ page }) => {
    await seedItemState(page, {
      gold: 30,
      patchKit: 0,
      worldPosition: { x: 21, y: 12 },
    })
    await page.goto('/world')

    await page.getByRole('button', { name: 'INTERACT' }).click()
    const shop = page.getByRole('dialog', { name: 'World shop' })
    const item = shop.locator('[data-item-id="patch-kit"]')
    await expect(item).toHaveAttribute('data-item-state', 'available')
    await expect(item.locator('img')).toHaveAttribute('src', '/pixel-art/items/patch-kit.svg')
    await expect(item.getByText('HP +24', { exact: true })).toBeVisible()
    await expect(item.getByText('BATTLE ONLY · 1 USE', { exact: true })).toBeVisible()
    await item.getByRole('button', { name: '▶ BUY' }).click()

    const stored = await storedState(page)
    expect(stored.progress.progress.gold).toBe(0)
    expect(stored.progress.progress.inventory.patchKit).toBe(1)

    await shop.getByRole('button', { name: 'ショップを閉じる' }).click()
    await page.getByRole('button', { name: 'Pause menuを開く' }).click()
    const pause = page.getByRole('dialog', { name: 'Pause menu' })
    await pause.getByRole('button', { name: 'ITEMS' }).click()
    const inventoryItem = pause.locator('[data-item-id="patch-kit"]')
    await expect(inventoryItem).toHaveAttribute('data-item-count', '1')
    await expect(inventoryItem.locator('img')).toHaveAttribute('src', '/pixel-art/items/patch-kit.svg')
  })

  test('BattleでPATCH KITを使用するとHPとstockを更新しUSED理由を表示する', async ({ page }) => {
    await seedItemState(page, { patchKit: 1, currentHp: 40 })
    await page.goto('/javascript/battle/1?seed=item-use-e2e&returnTo=%2Fworld')

    const item = page.locator('.battle-item-row[data-item-id="patch-kit"]')
    await expect(item).toHaveAttribute('data-item-state', 'available')
    await expect(item.locator('img')).toHaveAttribute('src', '/pixel-art/items/patch-kit.svg')
    await expect(item.getByText('READY · BATTLE ONLY', { exact: true })).toBeVisible()

    const useButton = item.getByRole('button', { name: /PATCH KIT ×1/ })
    await expect(useButton).toBeEnabled()
    await useButton.click()

    await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('64/108')
    await expect(item).toHaveAttribute('data-item-state', 'already-used')
    await expect(item.getByText('PATCH KIT ×0', { exact: true })).toBeVisible()
    await expect(item.getByText('RECOVERED +24 HP · USED THIS BATTLE', { exact: true })).toBeVisible()

    const stored = await storedState(page)
    expect(stored.rpg.state.currentHp).toBe(64)
    expect(stored.progress.progress.inventory.patchKit).toBe(0)
  })

  test('同じStageを別seedでreplayするとBattle itemの使用回数をresetする', async ({ page }) => {
    await seedItemState(page, { patchKit: 2, currentHp: 40 })
    await page.goto('/javascript/battle/1?seed=item-replay-a&returnTo=%2Fworld')

    let item = page.locator('.battle-item-row[data-item-id="patch-kit"]')
    await item.getByRole('button', { name: /PATCH KIT ×2/ }).click()
    await expect(item).toHaveAttribute('data-item-state', 'already-used')
    await expect(item.getByText('PATCH KIT ×1', { exact: true })).toBeVisible()

    await page.goto('/javascript/battle/1?seed=item-replay-b&returnTo=%2Fworld')
    item = page.locator('.battle-item-row[data-item-id="patch-kit"]')
    await expect(item).toHaveAttribute('data-item-state', 'available')
    await expect(item.getByText('READY · BATTLE ONLY', { exact: true })).toBeVisible()
    await expect(item.getByRole('button', { name: /PATCH KIT ×1/ })).toBeEnabled()
  })

  test('BattleでNO STOCK / HP FULLを明示して使用不可にする', async ({ page }) => {
    await seedItemState(page, { patchKit: 0, currentHp: 40 })
    await page.goto('/javascript/battle/1?seed=item-no-stock-e2e&returnTo=%2Fworld')

    let item = page.locator('.battle-item-row[data-item-id="patch-kit"]')
    await expect(item).toHaveAttribute('data-item-state', 'no-stock')
    await expect(item.getByText('NO STOCK', { exact: true })).toBeVisible()
    await expect(item.getByRole('button', { name: /PATCH KIT ×0/ })).toBeDisabled()

    await seedItemState(page, { patchKit: 1, currentHp: 108 })
    await page.goto('/javascript/battle/1?seed=item-hp-full-e2e&returnTo=%2Fworld')

    item = page.locator('.battle-item-row[data-item-id="patch-kit"]')
    await expect(item).toHaveAttribute('data-item-state', 'hp-full')
    await expect(item.getByText('HP FULL', { exact: true })).toBeVisible()
    await expect(item.getByRole('button', { name: /PATCH KIT ×1/ })).toBeDisabled()
  })

  test('TYPE CACHE取得時に同じPATCH KIT visualでItem rewardを表示する', async ({ page }) => {
    await seedItemState(page, {
      gold: 10,
      patchKit: 2,
      worldPosition: { x: 30, y: 18 },
    })
    await page.goto('/world')

    await page.getByRole('button', { name: 'INTERACT' }).click()
    await expect(page.getByText(/TYPE CACHE OPEN/)).toBeVisible()

    const reward = page.locator('[data-item-reward-id="patch-kit"]')
    await expect(reward).toBeVisible()
    await expect(reward).toHaveAttribute('data-item-reward-count', '1')
    await expect(reward.locator('img')).toHaveAttribute('src', '/pixel-art/items/patch-kit.svg')
    await expect(reward.getByText('ITEM ACQUIRED', { exact: true })).toBeVisible()
    await expect(reward.getByText('PATCH KIT ×1', { exact: true })).toBeVisible()

    const stored = await storedState(page)
    expect(stored.progress.progress.gold).toBe(45)
    expect(stored.progress.progress.inventory.patchKit).toBe(3)
  })
})

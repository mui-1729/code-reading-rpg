import { readStoredGameState } from './storedGameState'
import { expect, test, type Page } from '@playwright/test'
import { JS_BATTLE_1_PREREQS, JS_COMPLETE } from './canonical-progress-fixtures'

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
    clearedStageIds?: readonly number[]
  } = {},
) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, gold, patchKit, currentHp, worldPosition, clearedStageIds }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold,
            inventory: { patchKit },
            clearedStageIds,
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [7],
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
      clearedStageIds: options.clearedStageIds ?? [...JS_BATTLE_1_PREREQS],
    },
  )
}

async function dismissStory(page: Page) {
  const story = page.locator('.battle-story-window')
  await expect(story).toBeVisible()
  await story.getByRole('button', { name: 'スキップ', exact: true }).click()
  await expect(story).toBeHidden()
}

async function openBattleItems(page: Page) {
  await page.getByRole('button', { name: 'アイテム', exact: true }).click()
  await expect(page.getByLabel('戦闘アイテム一覧')).toBeVisible()
}

async function openPatchKitDetail(page: Page) {
  await openBattleItems(page)
  const row = page.locator('.battle-item-browser-row[data-item-id="patch-kit"]')
  await row.click()
  const detail = page.locator('.battle-item-detail[data-item-id="patch-kit"]')
  await expect(detail).toBeVisible()
  return detail
}

async function storedState(page: Page) {
  return readStoredGameState(page)
}

test.describe('Item / Inventory UX', () => {
  test('existing v4 inventoryをメニューのitem cardへそのまま表示する', async ({ page }) => {
    await seedItemState(page, { patchKit: 2 })
    await page.goto('/world')

    await page.getByRole('button', { name: 'メニューを開く' }).click()
    const pause = page.getByRole('dialog', { name: 'メニュー' })
    await pause.getByRole('button', { name: 'アイテム' }).click()

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

    await page.getByRole('button', { name: 'ショップを見る' }).click()
    const shop = page.getByRole('dialog', { name: 'ショップ' })
    const item = shop.locator('[data-item-id="patch-kit"]')
    await expect(item).toHaveAttribute('data-item-state', 'available')
    await expect(item.locator('img')).toHaveAttribute('src', '/pixel-art/items/patch-kit.svg')
    await expect(item.getByText('HP +24', { exact: true })).toBeVisible()
    await expect(item.getByText('戦闘専用 · 1回', { exact: true })).toBeVisible()
    await item.getByRole('button', { name: '▶ 購入' }).click()

    const stored = await storedState(page)
    expect(stored.progress.progress.gold).toBe(0)
    expect(stored.progress.progress.inventory.patchKit).toBe(1)

    await shop.getByRole('button', { name: 'ショップを閉じる' }).click()
    await page.getByRole('button', { name: 'メニューを開く' }).click()
    const pause = page.getByRole('dialog', { name: 'メニュー' })
    await pause.getByRole('button', { name: 'アイテム' }).click()
    const inventoryItem = pause.locator('[data-item-id="patch-kit"]')
    await expect(inventoryItem).toHaveAttribute('data-item-count', '1')
    await expect(inventoryItem.locator('img')).toHaveAttribute('src', '/pixel-art/items/patch-kit.svg')
  })

  test('BattleでPATCH KITを使用するとHPとstockを更新し使用済み理由を表示する', async ({ page }) => {
    await seedItemState(page, { patchKit: 1, currentHp: 40 })
    await page.goto('/javascript/battle/1?seed=item-use-e2e&returnTo=%2Fworld')
    await dismissStory(page)
    await openBattleItems(page)

    let row = page.locator('.battle-item-browser-row[data-item-id="patch-kit"]')
    await expect(row.locator('img')).toHaveAttribute('src', '/pixel-art/items/patch-kit.svg')
    await expect(row).toContainText('PATCH KIT ×1')
    await expect(row.locator('[data-item-availability="available"]')).toContainText('使用可能')
    await row.click()

    let detail = page.locator('.battle-item-detail[data-item-id="patch-kit"]')
    const useButton = detail.getByRole('button', { name: /PATCH KIT ×1を使う/ })
    await expect(useButton).toBeEnabled()
    await useButton.click()

    await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('64/108')
    const stored = await storedState(page)
    expect(stored.rpg.state.currentHp).toBe(64)
    expect(stored.progress.progress.inventory.patchKit).toBe(0)

    detail = await openPatchKitDetail(page)
    await expect(detail).toContainText('PATCH KIT ×0')
    await expect(detail).toContainText('この戦闘では使用済み')
    await expect(detail.locator('.patch-kit-action')).toBeDisabled()
  })

  test('未完了Stageを別seedで開くと回復と消費をrollbackして使用回数もresetする', async ({ page }) => {
    await seedItemState(page, { patchKit: 2, currentHp: 40 })
    await page.goto('/javascript/battle/1?seed=item-replay-a&returnTo=%2Fworld')
    await dismissStory(page)

    let detail = await openPatchKitDetail(page)
    await detail.getByRole('button', { name: /PATCH KIT ×2を使う/ }).click()
    await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('64/108')

    await page.goto('/javascript/battle/1?seed=item-replay-b&returnTo=%2Fworld')
    await dismissStory(page)
    await openBattleItems(page)
    const row = page.locator('.battle-item-browser-row[data-item-id="patch-kit"]')
    await expect(row).toContainText('PATCH KIT ×2')
    await expect(row.locator('[data-item-availability="available"]')).toContainText('使用可能')
    await row.click()
    detail = page.locator('.battle-item-detail[data-item-id="patch-kit"]')
    await expect(detail.locator('.patch-kit-action')).toBeEnabled()
    await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('40/108')
  })

  test('Battleで所持なし / HP満タンを明示して使用不可にする', async ({ page }) => {
    await seedItemState(page, { patchKit: 0, currentHp: 40 })
    await page.goto('/javascript/battle/1?seed=item-no-stock-e2e&returnTo=%2Fworld')
    await dismissStory(page)
    let detail = await openPatchKitDetail(page)
    await expect(detail).toContainText('所持なし')
    await expect(detail.getByRole('button', { name: /PATCH KIT ×0を使う/ })).toBeDisabled()

    await seedItemState(page, { patchKit: 1, currentHp: 108 })
    await page.goto('/javascript/battle/1?seed=item-hp-full-e2e&returnTo=%2Fworld')
    await dismissStory(page)
    detail = await openPatchKitDetail(page)
    await expect(detail).toContainText('HP満タン')
    await expect(detail.getByRole('button', { name: /PATCH KIT ×1を使う/ })).toBeDisabled()
  })

  test('TYPE CACHE取得時に同じPATCH KIT visualでItem rewardを表示する', async ({ page }) => {
    await seedItemState(page, {
      gold: 10,
      patchKit: 2,
      worldPosition: { x: 30, y: 18 },
      clearedStageIds: JS_COMPLETE,
    })
    await page.goto('/world')

    await page.getByRole('button', { name: '宝箱を開ける' }).click()
    await expect(page.getByText(/TYPE CACHE 開封/)).toBeVisible()

    const reward = page.locator('[data-item-reward-id="patch-kit"]')
    await expect(reward).toBeVisible()
    await expect(reward).toHaveAttribute('data-item-reward-count', '1')
    await expect(reward.locator('img')).toHaveAttribute('src', '/pixel-art/items/patch-kit.svg')
    await expect(reward.getByText('アイテム獲得', { exact: true })).toBeVisible()
    await expect(reward.getByText('PATCH KIT ×1', { exact: true })).toBeVisible()

    const stored = await storedState(page)
    expect(stored.progress.progress.gold).toBe(45)
    expect(stored.progress.progress.inventory.patchKit).toBe(3)
  })
})

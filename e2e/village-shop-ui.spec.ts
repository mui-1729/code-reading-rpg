import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedVillageShop(page: Page, position: { x: number; y: number }, width: number, height: number) {
  await page.setViewportSize({ width, height })
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, position }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 12,
          gold: 200,
          inventory: { patchKit: 0 },
          clearedStageIds: [1],
          clearedAreaIds: [],
          completedSideQuestIds: [],
          unlockedStageIds: [1, 7],
          unlockedSkillIds: ['trace', 'pulse', 'nova'],
        },
      }))
      localStorage.setItem(rpgKey, JSON.stringify({
        version: 7,
        state: {
          equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
          ownedEquipmentIds: ['training-blade', 'traveler-coat'],
          partyMemberIds: ['byte'],
          partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
          worldMapId: 'js-village',
          worldPosition: position,
          safeCheckpoint: {
            id: 'greenfield-village',
            mapId: 'js-village',
            position: { x: 10, y: 12 },
          },
          stepsSinceEncounter: 0,
          encounterCount: 0,
          currentHp: 108,
          openedTreasureIds: [],
        },
      }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY, position },
  )
  await page.goto('/world')
  await page.getByRole('button', { name: '上へ移動' }).click()
  await expect(page.locator('.world-player-sprite')).toHaveAttribute('data-facing', 'up')
}

test('Village道具屋は最初のShopと同じitem card / cost previewを使う', async ({ page }) => {
  await seedVillageShop(page, { x: 14, y: 12 }, 1280, 900)

  await page.getByRole('button', { name: '道具屋を見る' }).click()
  const shop = page.getByRole('dialog', { name: '道具屋' })
  await expect(shop).toBeVisible()
  await expect(shop).toContainText('グリーンフィールド村 // 道具屋')
  await expect(shop.getByRole('region', { name: '消耗品' })).toBeVisible()
  await expect(shop.getByRole('region', { name: '装備品' })).toHaveCount(0)

  const patchKit = shop.locator('[data-item-id="patch-kit"]')
  await expect(patchKit).toHaveAttribute('data-item-state', 'available')
  await expect(patchKit.locator('img')).toHaveAttribute('src', '/pixel-art/items/patch-kit.svg')
  await expect(patchKit.getByText('戦闘アイテム', { exact: true })).toBeVisible()
  await expect(patchKit.getByText('HP +24', { exact: true })).toBeVisible()
  await expect(patchKit.getByText('戦闘専用 · 1回', { exact: true })).toBeVisible()

  const quote = patchKit.locator('.shop-cost-preview')
  await expect(quote.getByText('所持金', { exact: true })).toBeVisible()
  await expect(quote.getByText('価格', { exact: true })).toBeVisible()
  await expect(quote.getByText('購入後', { exact: true })).toBeVisible()
  await expect(quote.getByText('200 G', { exact: true })).toBeVisible()
  await expect(quote.getByText('30 G', { exact: true })).toBeVisible()
  await expect(quote.getByText('170 G', { exact: true })).toBeVisible()
  await expect(shop.getByRole('button', { name: '道具屋を閉じる' })).toBeVisible()
})

test('MobileのVillage装備屋も最初のShopと同じ比較・state表示を使う', async ({ page }) => {
  await seedVillageShop(page, { x: 15, y: 12 }, 390, 844)

  await page.getByRole('button', { name: '装備屋を見る' }).click()
  const shop = page.getByRole('dialog', { name: '装備屋' })
  await expect(shop).toBeVisible()
  await expect(shop).toContainText('グリーンフィールド村 // 装備屋')
  await expect(shop.getByRole('region', { name: '消耗品' })).toHaveCount(0)
  await expect(shop.getByRole('region', { name: '装備品' })).toBeVisible()

  const guardEdge = shop.locator('[data-equipment-id="guard-edge"]')
  await expect(guardEdge).toHaveAttribute('data-equipment-state', 'available')
  await expect(guardEdge.locator('img')).toHaveAttribute(
    'src',
    '/pixel-art/equipment/weapons/guard-edge.svg',
  )
  await expect(guardEdge.getByText('ATK +4 · DEF +2', { exact: true })).toBeVisible()
  await expect(guardEdge.getByText('現在装備 · Training Blade', { exact: true })).toBeVisible()
  await expect(guardEdge.getByText('ATK +1 · DEF +2', { exact: true })).toBeVisible()
  await expect(guardEdge.locator('.equipment-state-badge')).toHaveText('購入可能')

  const quote = guardEdge.locator('.shop-cost-preview')
  await expect(quote.getByText('200 G', { exact: true })).toBeVisible()
  await expect(quote.getByText('55 G', { exact: true })).toBeVisible()
  await expect(quote.getByText('145 G', { exact: true })).toBeVisible()
  await expect(shop.getByRole('button', { name: '装備屋を閉じる' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
})

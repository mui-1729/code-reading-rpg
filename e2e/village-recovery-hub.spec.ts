import { expect, test, type Page } from '@playwright/test'
import { readStoredGameState } from './storedGameState'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedVillage(page: Page, position: { x: number; y: number }, currentHp = 52) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, position, currentHp }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 200,
            inventory: { patchKit: 0 },
            clearedStageIds: [1],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 7],
            unlockedSkillIds: ['trace', 'pulse', 'nova'],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 5,
          state: {
            equipment: {
              weapon: 'training-blade',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: ['byte'],
            partyEquipment: {},
            worldMapId: 'js-village',
            worldPosition: position,
            stepsSinceEncounter: 0,
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
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY, position, currentHp },
  )
  await page.goto('/world')
}

test('Villageの宿でGoldを払いHPを回復できる', async ({ page }) => {
  await seedVillage(page, { x: 5, y: 12 })

  const innButton = page.getByRole('button', { name: '宿で休む' })
  await expect(innButton).toBeVisible()
  await expect(innButton).toBeEnabled()
  await innButton.click()

  const inn = page.getByRole('dialog', { name: '宿' })
  await expect(inn).toContainText('グリーンフィールド村 // 休息所')
  await inn.getByRole('button', { name: '▶ 休む' }).click()

  const stored = await readStoredGameState(page)
  expect(stored.rpg.state.currentHp).toBeGreaterThan(52)
  expect(stored.progress.progress.gold).toBeLessThan(200)
})

test('Villageの道具屋は消耗品だけを扱う', async ({ page }) => {
  await seedVillage(page, { x: 14, y: 12 }, 100)

  await page.getByRole('button', { name: '道具屋を見る' }).click()
  const shop = page.getByRole('dialog', { name: '道具屋' })
  await expect(shop).toBeVisible()
  await expect(shop.getByText('PATCH KIT', { exact: true })).toBeVisible()
  await expect(shop.locator('[data-equipment-id]')).toHaveCount(0)
})

test('Villageの装備屋は装備だけを扱い既存purchase domainを使える', async ({ page }) => {
  await seedVillage(page, { x: 15, y: 12 }, 100)

  await page.getByRole('button', { name: '装備屋を見る' }).click()
  const shop = page.getByRole('dialog', { name: '装備屋' })
  await expect(shop).toBeVisible()
  await expect(shop.locator('[data-equipment-id="guard-edge"]')).toBeVisible()
  await expect(shop.locator('[data-item-id]')).toHaveCount(0)

  await shop.locator('[data-equipment-id="guard-edge"]').getByRole('button', { name: '▶ 購入' }).click()
  const stored = await readStoredGameState(page)
  expect(stored.rpg.state.ownedEquipmentIds).toContain('guard-edge')
  expect(stored.progress.progress.gold).toBeLessThan(200)
})

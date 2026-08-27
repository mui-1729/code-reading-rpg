import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

const createProgress = (gold: number) => ({
  version: 4,
  progress: {
    exp: 0,
    gold,
    inventory: { patchKit: 0 },
    clearedStageIds: [],
    clearedAreaIds: [],
    completedSideQuestIds: [],
    unlockedStageIds: [1, 4],
    unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
  },
})

const createRpgState = () => ({
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
    worldPosition: { x: 20, y: 11 },
    stepsSinceEncounter: 8,
    encounterCount: 0,
    currentHp: 108,
    openedTreasureIds: [],
  },
})

async function seedShopState(page: Page) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify(createProgressForBrowser(200)))
      localStorage.setItem(rpgKey, JSON.stringify(createRpgStateForBrowser()))
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )

      function createProgressForBrowser(gold: number) {
        return {
          version: 4,
          progress: {
            exp: 0,
            gold,
            inventory: { patchKit: 0 },
            clearedStageIds: [],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 4],
            unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
          },
        }
      }

      function createRpgStateForBrowser() {
        return {
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
            worldPosition: { x: 20, y: 11 },
            stepsSinceEncounter: 8,
            encounterCount: 0,
            currentHp: 108,
            openedTreasureIds: [],
          },
        }
      }
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY },
  )
  await page.reload()
}

async function storedProgress(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), PROGRESS_KEY)
}

async function storedRpgState(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), RPG_KEY)
}

test('Hub ShopでItem / Equipmentを選んで購入しPauseから装備できる', async ({ page }) => {
  await seedShopState(page)
  await page.goto('/world')

  await page.getByRole('button', { name: 'INTERACT' }).click()
  const shop = page.getByRole('dialog', { name: 'Hub Shop' })
  await expect(shop).toBeVisible()
  await expect(shop.getByText('200 G', { exact: true })).toBeVisible()

  await shop.getByRole('button', { name: 'Buy PATCH KIT' }).click()
  await expect(shop.getByText('STOCK ×1', { exact: true })).toBeVisible()
  await expect(shop.getByText('170 G', { exact: true })).toBeVisible()
  await expect.poll(async () => (await storedProgress(page)).progress.inventory.patchKit).toBe(1)

  await shop.getByRole('button', { name: 'Buy Guard Blade' }).click()
  await expect(shop.getByRole('button', { name: 'Buy Guard Blade' })).toBeDisabled()
  await expect(shop.getByText('115 G', { exact: true })).toBeVisible()
  await expect.poll(async () => (await storedRpgState(page)).state.ownedEquipmentIds).toContain(
    'guard-blade',
  )

  await shop.getByRole('button', { name: 'Close shop' }).click()
  await expect(shop).toBeHidden()

  await page.getByRole('button', { name: 'Pause menuを開く' }).click()
  const pause = page.getByRole('dialog', { name: 'Pause menu' })
  await pause.getByRole('button', { name: 'EQUIPMENT' }).click()

  const guardBlade = pause.getByRole('button', { name: /Guard Blade/ })
  await expect(guardBlade).toBeVisible()
  await expect(guardBlade).toContainText('ATK +1')
  await expect(guardBlade).toContainText('DEF +2')
  await guardBlade.click()

  await expect.poll(async () => (await storedRpgState(page)).state.equipment.weapon).toBe(
    'guard-blade',
  )
})

void createProgress
void createRpgState

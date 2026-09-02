import { readStoredProgress } from './storedGameState'
import { expect, test, type Page } from '@playwright/test'
import { JS_BATTLE_1_PREREQS } from './canonical-progress-fixtures'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedBattle(page: Page) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, clearedStageIds }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 0,
            inventory: { patchKit: 2 },
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
          version: 4,
          state: {
            equipment: {
              weapon: 'training-blade',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: [],
            partyEquipment: {},
            worldMapId: 'overworld',
            worldPosition: { x: 20, y: 14 },
            stepsSinceEncounter: 8,
            encounterCount: 0,
            currentHp: 40,
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
      clearedStageIds: [...JS_BATTLE_1_PREREQS],
    },
  )
}

async function storedProgress(page: Page) {
  return readStoredProgress(page)
}

async function dismissStory(page: Page) {
  const story = page.locator('.battle-story-window')
  await expect(story).toBeVisible()
  await story.getByRole('button', { name: 'SKIP' }).click()
  await expect(story).toBeHidden()
}

test('PATCH KITはcompact ITEMから開き、在庫2個でも同一Battleで使用1回に制限する', async ({ page }) => {
  await seedBattle(page)
  await page.goto('/javascript/battle/1?seed=patch-kit-single-use&returnTo=%2Fworld')
  await dismissStory(page)

  const item = page.locator('.battle-item-row[data-item-id="patch-kit"]')
  const itemToggle = item.locator('.battle-item-toggle')
  const patchKit = item.locator('.patch-kit-action')
  await expect(item).toHaveAttribute('data-item-state', 'available')
  await expect(itemToggle).toBeVisible()
  await expect(itemToggle).toContainText('ITEM')
  await expect(itemToggle).toContainText('PATCH KIT ×2')
  await expect(patchKit).toBeHidden()

  await itemToggle.click()
  await expect(page.locator('.patch-kit-action:visible')).toHaveCount(1)
  await expect(patchKit).toBeEnabled()
  await expect(patchKit).toHaveAttribute('aria-label', /PATCH KIT ×2/)
  await patchKit.click()

  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('64/108')
  await expect(item).toHaveAttribute('data-item-state', 'already-used')
  await expect(patchKit).toBeDisabled()
  await expect(patchKit).toHaveAttribute('aria-label', /PATCH KIT ×1/)
  await expect.poll(async () => (await storedProgress(page)).progress.inventory.patchKit).toBe(1)

  await patchKit.click({ force: true })
  await expect.poll(async () => (await storedProgress(page)).progress.inventory.patchKit).toBe(1)
  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('64/108')

  await page.goto('/javascript/battle/1?seed=patch-kit-next-battle&returnTo=%2Fworld')
  await dismissStory(page)
  const nextItem = page.locator('.battle-item-row[data-item-id="patch-kit"]')
  const nextPatchKit = nextItem.locator('.patch-kit-action')
  await expect(nextItem).toHaveAttribute('data-item-state', 'available')
  await expect(nextPatchKit).toBeHidden()
  await nextItem.locator('.battle-item-toggle').click()
  await expect(page.locator('.patch-kit-action:visible')).toHaveCount(1)
  await expect(nextPatchKit).toBeEnabled()
  // Leaving an unfinished attempt rolls back both healing and its item cost.
  await expect(nextPatchKit).toHaveAttribute('aria-label', /PATCH KIT ×2/)
  await expect(page.locator('.player-panel .status-label-row strong')).toHaveText('40/108')
  await expect.poll(async () => (await storedProgress(page)).progress.inventory.patchKit).toBe(2)
})

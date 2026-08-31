import { readStoredGameState } from './storedGameState'
import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

const clearedThroughDeepFilter = [7, 8, 9, 1, 10, 11, 12, 13, 14, 2, 15]

async function seedExploration(
  page: Page,
  mapId: 'js-forest' | 'js-deep-forest',
  position: { x: number; y: number },
) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, mapId, position, clearedStageIds }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 10,
            inventory: { patchKit: 0 },
            clearedStageIds,
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [7],
            unlockedSkillIds: ['trace', 'pulse', 'nova'],
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
            partyMemberIds: ['byte'],
            partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
            worldMapId: mapId,
            worldPosition: position,
            stepsSinceEncounter: 0,
            encounterCount: 0,
            currentHp: 108,
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
      mapId,
      position,
      clearedStageIds: clearedThroughDeepFilter,
    },
  )
  await page.goto('/world')
}

test('Forestの南branchには寄り道Treasureがあり取得後もreloadでOPENを保つ', async ({ page }) => {
  await seedExploration(page, 'js-forest', { x: 21, y: 20 })

  const map = page.getByLabel('Forest map')
  await expect(map).toHaveAttribute('data-world-y', '20')
  await expect(page.getByLabel('js-forest-supply treasure closed')).toBeVisible()

  await page.getByRole('button', { name: 'INTERACT' }).click()
  await expect(page.getByText(/FOREST SUPPLY OPEN/)).toBeVisible()
  await expect(page.getByLabel('js-forest-supply treasure opened')).toBeVisible()

  await page.reload()
  await expect(page.getByLabel('js-forest-supply treasure opened')).toBeVisible()

  const stored = await readStoredGameState(page)
  expect(stored.progress.progress.gold).toBe(35)
  expect(stored.progress.progress.inventory.patchKit).toBe(1)
  expect(stored.rpg.state.openedTreasureIds).toContain('js-forest-supply')
})

test('390px幅でもDeep Forestの南branchを安全なtrailとして移動できる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedExploration(page, 'js-deep-forest', { x: 10, y: 20 })

  const map = page.getByLabel('Deep Forest map')
  await page.getByRole('button', { name: 'Move down' }).click()
  await page.getByRole('button', { name: 'Move down' }).click()
  await page.getByRole('button', { name: 'Move right' }).click()
  await page.getByRole('button', { name: 'Move right' }).click()
  await page.getByRole('button', { name: 'Move right' }).click()

  await expect(map).toHaveAttribute('data-world-x', '13')
  await expect(map).toHaveAttribute('data-world-y', '22')
  await expect(page.getByLabel('js-deep-forest-cache treasure closed')).toBeVisible()
  await expect(page).toHaveURL(/\/world$/)

  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflows).toBe(false)
})

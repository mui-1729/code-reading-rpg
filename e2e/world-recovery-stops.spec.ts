import { expect, test, type Page } from '@playwright/test'
import { JS_SECOND_INCIDENT_PREREQS, JS_TRAINING_COMPLETE } from './canonical-progress-fixtures'
import { readStoredRpg } from './storedGameState'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedMap(
  page: Page,
  mapId: 'js-forest' | 'js-deep-forest',
  position: { x: number; y: number },
  clearedStageIds: readonly number[],
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
            gold: 0,
            inventory: { patchKit: 0 },
            clearedStageIds,
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: clearedStageIds,
            unlockedSkillIds: ['trace', 'pulse', 'nova'],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 5,
          state: {
            equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: ['byte'],
            partyEquipment: {},
            worldMapId: mapId,
            worldPosition: position,
            stepsSinceEncounter: 0,
            encounterCount: 0,
            currentHp: 20,
            openedTreasureIds: [],
          },
        }),
      )
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY, mapId, position, clearedStageIds },
  )
  await page.goto('/world')
}

test('Forest中盤の野営地は0 Goldでも部分回復できる', async ({ page }) => {
  await seedMap(page, 'js-forest', { x: 20, y: 10 }, [...JS_TRAINING_COMPLETE])

  const camp = page.getByRole('button', { name: '野営地で休む' })
  await expect(camp).toBeVisible()
  await expect(camp).toBeEnabled()
  await expect(camp).toHaveAttribute('title', /無料でHPを60%まで回復/)
  await camp.click()

  await expect(page.getByRole('status')).toContainText('野営地: HPを')
  const stored = await readStoredRpg(page)
  expect(stored.state.currentHp).toBeGreaterThan(20)
})

test('Deep ForestはForestより奥に回復地点を置き同じsoft-lock回避を提供する', async ({ page }) => {
  await seedMap(page, 'js-deep-forest', { x: 16, y: 10 }, [...JS_SECOND_INCIDENT_PREREQS])

  const spring = page.getByRole('button', { name: '湧き水で休む' })
  await expect(spring).toBeVisible()
  await expect(spring).toBeEnabled()
  await spring.click()

  await expect(page.getByRole('status')).toContainText('湧き水: HPを')
  const stored = await readStoredRpg(page)
  expect(stored.state.currentHp).toBeGreaterThan(20)
})

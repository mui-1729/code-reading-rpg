import { expect, test } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('camera pan中も固定objectはterrain snapshotより前面に残る', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 0,
            inventory: { patchKit: 0 },
            clearedStageIds: [],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [],
            unlockedSkillIds: [],
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
            partyMemberIds: [],
            partyEquipment: {},
            worldMapId: 'overworld',
            worldPosition: { x: 20, y: 14 },
            stepsSinceEncounter: 0,
            encounterCount: 0,
            currentHp: 100,
            openedTreasureIds: [],
          },
        }),
      )
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY },
  )

  await page.goto('/world')
  const shop = page.locator('[data-world-x="20"][data-world-y="12"] .world-object').first()
  await expect(shop).toBeVisible()

  await page.getByRole('button', { name: 'Move right' }).click()
  const snapshot = page.locator('.world-camera-snapshot')
  await expect(snapshot).toBeVisible()

  const layers = await page.evaluate(() => {
    const snapshotElement = document.querySelector<HTMLElement>('.world-camera-snapshot')
    const objectElement = document.querySelector<HTMLElement>('.world-object')
    if (!snapshotElement || !objectElement) return null
    return {
      snapshot: Number(getComputedStyle(snapshotElement).zIndex),
      object: Number(getComputedStyle(objectElement).zIndex),
    }
  })

  expect(layers).not.toBeNull()
  expect(layers?.snapshot).toBeLessThan(layers?.object ?? 0)
  await expect(shop).toBeVisible()
})

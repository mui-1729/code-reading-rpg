import { expect, test } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('World chromeはgame-wide blue系semantic paletteを共有する', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({ version: 4, progress: { exp: 0, gold: 50, inventory: { patchKit: 0 }, clearedStageIds: [], clearedAreaIds: [], completedSideQuestIds: [], unlockedStageIds: [], unlockedSkillIds: [] } }))
      localStorage.setItem(rpgKey, JSON.stringify({ version: 5, state: { equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null }, ownedEquipmentIds: ['training-blade', 'traveler-coat'], partyMemberIds: [], partyEquipment: {}, worldMapId: 'overworld', worldPosition: { x: 20, y: 14 }, stepsSinceEncounter: 0, encounterCount: 0, currentHp: 100, openedTreasureIds: [] } }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY },
  )

  await page.goto('/world')
  const worldObjectiveBorder = await page.locator('.world-next-objective').evaluate((element) => getComputedStyle(element).borderTopColor)
  expect(worldObjectiveBorder).toBe('rgb(79, 140, 255)')

  const worldFrame = await page.locator('.world-panel').evaluate((element) => getComputedStyle(element).borderTopColor)
  expect(worldFrame).toBe('rgb(84, 84, 124)')

  await page.getByRole('button', { name: 'Pause menuを開く' }).click()
  const pauseActiveBorder = await page.locator('.pause-tabs button.is-active').evaluate((element) => getComputedStyle(element).borderTopColor)
  expect(pauseActiveBorder).toBe('rgb(79, 140, 255)')
})

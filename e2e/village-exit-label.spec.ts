import { expect, test } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('@responsive GREENFIELD VILLAGEの出口labelはDOMの日本語表示1系統だけにする', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 12,
            gold: 20,
            inventory: { patchKit: 0 },
            clearedStageIds: [1],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 7],
            unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper'],
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
            worldMapId: 'js-village',
            worldPosition: { x: 10, y: 13 },
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

  const village = page.locator('.world-viewport[data-world-map="js-village"]')
  const exitTile = village.locator('[data-world-x="10"][data-world-y="14"].terrain-exit')

  await expect(village).toBeVisible()
  await expect(exitTile).toBeVisible()
  await expect(exitTile.locator('.exit-object')).toHaveText('出口')
  await expect(exitTile.locator('.exit-object')).toHaveCount(1)
  await expect(exitTile).not.toContainText('EXIT')

  const pseudoContent = await exitTile.evaluate((element) => getComputedStyle(element, '::after').content)
  expect(pseudoContent).toBe('none')
})

import { expect, test } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('GREENFIELD VILLAGE入口からTRAIN・住人・生活scenery・出口が同じ導線として読める', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 12,
          gold: 20,
          inventory: { patchKit: 0 },
          clearedStageIds: [1],
          clearedAreaIds: [],
          completedSideQuestIds: [],
          unlockedStageIds: [1, 7],
          unlockedSkillIds: ['trace', 'pulse', 'nova'],
        },
      }))
      localStorage.setItem(rpgKey, JSON.stringify({
        version: 5,
        state: {
          equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
          ownedEquipmentIds: ['training-blade', 'traveler-coat'],
          partyMemberIds: [],
          partyEquipment: {},
          worldMapId: 'js-village',
          worldPosition: { x: 10, y: 12 },
          stepsSinceEncounter: 0,
          encounterCount: 0,
          currentHp: 108,
          openedTreasureIds: [],
        },
      }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY },
  )

  await page.goto('/world')
  const village = page.locator('.world-viewport[data-world-map="js-village"]')
  await expect(village).toBeVisible()
  await expect(village.locator('[data-world-x="12"][data-world-y="7"].terrain-training')).toBeVisible()
  await expect(village.locator('[data-world-x="10"][data-world-y="8"]')).toBeVisible()
  await expect(village.locator('[data-world-x="10"][data-world-y="14"].terrain-exit')).toBeVisible()

  for (const npcId of ['trainer-mio', 'village-child', 'forest-traveler', 'misfire-adventurer']) {
    await expect(village.locator(`[data-world-npc="${npcId}"]`)).toBeVisible()
  }

  for (const npcId of ['village-child', 'forest-traveler', 'misfire-adventurer']) {
    await expect(village.locator(`[data-world-npc="${npcId}"] .world-resident-marker`)).toHaveCSS('font-size', '0px')
  }

  const entryPurpose = await village.locator('.world-entry-transition').evaluate((element) =>
    getComputedStyle(element, '::after').content,
  )
  expect(entryPurpose).toContain('安全な中継地点')
})

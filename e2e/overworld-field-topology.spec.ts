import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedField(page: Page, position: { x: number; y: number }) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, position }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 0,
          gold: 0,
          inventory: { patchKit: 0 },
          clearedStageIds: [1, 7, 8, 9],
          clearedAreaIds: [],
          completedSideQuestIds: [],
          unlockedStageIds: [1, 7, 8, 9, 10],
          unlockedSkillIds: ['trace', 'pulse', 'nova'],
        },
      }))
      localStorage.setItem(rpgKey, JSON.stringify({
        version: 6,
        state: {
          equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
          ownedEquipmentIds: ['training-blade', 'traveler-coat'],
          partyMemberIds: ['byte'],
          partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
          worldMapId: 'overworld',
          worldPosition: position,
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
}

test('@responsive Overworldの橋区間は川を越えた先で進路が南→東へ曲がる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedField(page, { x: 28, y: 29 })

  const world = page.locator('.world-viewport[data-world-map="overworld"]')
  await expect(world).toBeVisible()
  await expect(world.locator('[data-world-x="25"][data-world-y="29"].terrain-water')).toBeVisible()
  await expect(world.locator('[data-world-x="28"][data-world-y="29"].terrain-road')).toBeVisible()
  await expect(world.locator('[data-world-x="28"][data-world-y="31"].terrain-road')).toBeVisible()
  await expect(world.locator('[data-world-x="31"][data-world-y="31"].terrain-road')).toBeVisible()
  await expect(world.locator('.terrain-woods, .terrain-deep-woods')).not.toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
})

test('@responsive Forest入口は長いFieldの先にあり周囲が森景観として読める', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedField(page, { x: 34, y: 33 })

  const world = page.locator('.world-viewport[data-world-map="overworld"]')
  const entrance = world.locator('.world-tile[data-world-x="34"][data-world-y="34"]')
  await expect(entrance).toBeVisible()
  await expect.poll(() => entrance.evaluate((element) => getComputedStyle(element).getPropertyValue('--portal-scene-kind').trim())).toBe('forest-arch')
  await expect(world.locator('[data-world-x="34"][data-world-y="33"].terrain-road')).toBeVisible()
  await expect(world.locator('.terrain-woods, .terrain-deep-woods')).not.toHaveCount(0)
})

test('@responsive Village南の川辺loopには本道以外へ歩く理由としてTreasureがある', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedField(page, { x: 9, y: 32 })

  const world = page.locator('.world-viewport[data-world-map="overworld"]')
  await expect(world.locator('[data-world-x="8"][data-world-y="33"].terrain-treasure')).toBeVisible()
  await expect(world.locator('[data-world-x="9"][data-world-y="34"].terrain-road')).toBeVisible()
  await expect(world.locator('[data-world-x="7"][data-world-y="29"].terrain-road')).toBeVisible()
  await expect(world.locator('[data-world-x="8"][data-world-y="36"].terrain-water')).toBeVisible()
})
